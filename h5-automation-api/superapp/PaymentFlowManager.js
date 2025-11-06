import SuperAppPayment from './SuperAppPayment.js';
import { ORDER_STATUS } from './statusService.js';

/**
 * PaymentFlowManager - Orchestrates the complete payment flow
 * Separates business logic from UI components for better maintainability
 * 
 * NOTE: This is the airtime app version. For bill payments, create BillPaymentFlowManager.js
 * that adapts buildOrderData, buildCallbackData, and postPaymentToAppleTree methods.
 */
class PaymentFlowManager {
  constructor(logCallback = null) {
    this.logCallback = logCallback || (() => {});
    this.superApp = null;
  }

  /**
   * Helper to send error logs back to UI (production mode)
   */
  log(type, message, data = null) {
    // Only log errors in production
    if (type === 'error') {
      this.logCallback(type, message, data);
    }
  }

  /**
   * Setup global error handlers for comprehensive error capture
   */
  setupErrorHandlers() {
    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', '🚨 Unhandled Promise Rejection', {
        reason: event.reason?.message || event.reason,
        stack: event.reason?.stack,
        promise: 'Promise rejected',
        timestamp: new Date().toISOString()
      });
      event.preventDefault(); // Prevent console error
    });
    
    window.addEventListener('error', (event) => {
      this.log('error', '🚨 Global Error Caught', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.message || event.error,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
      event.preventDefault(); // Prevent console error
    });
  }

  /**
   * Initialize SuperApp payment system
   */
  async initialize() {
    try {
      this.log('info', '🔧 Initializing SuperAppPayment class...');
      this.superApp = new SuperAppPayment({ logger: this.logCallback });
      this.log('success', '✅ SuperAppPayment initialized');
      return this.superApp;
    } catch (initError) {
      this.log('error', '❌ Failed to initialize SuperAppPayment', {
        message: initError.message,
        name: initError.name,
        stack: initError.stack
      });
      throw initError;
    }
  }

  /**
   * Build and validate callback data
   */
  buildCallbackData(phoneData, selectedBundle) {
    const callbackData = {
      phoneNumber: phoneData?.recipientNumber || 'N/A',
      carrier: phoneData?.recipientCarrier?.name || phoneData?.recipientCarrier?.carrier?.name || 'Unknown',
      bundle: selectedBundle.name || 'Standard Airtime',
      bundleAmount: selectedBundle.amount || 'N/A',
      country: phoneData?.recipientCarrier?.country?.countryName || phoneData?.country?.countryName || 'Unknown'
    };
    
    this.log('info', '🔍 Validating callback data...');
    this.log('data', '📋 Callback Data (Raw)', callbackData);
    
    // Check for any undefined or null values
    const hasInvalidData = Object.values(callbackData).some(value => 
      value === undefined || value === null || value === ''
    );
    
    if (hasInvalidData) {
      this.log('error', '⚠️ Callback data has invalid values', {
        callbackData,
        invalidFields: Object.entries(callbackData)
          .filter(([key, value]) => value === undefined || value === null || value === '')
          .map(([key]) => key)
      });
    }
    
    return callbackData;
  }

  /**
   * Build order data for payment
   */
  buildOrderData(phoneData, selectedBundle) {
    const callbackData = this.buildCallbackData(phoneData, selectedBundle);
    
    const orderData = {
      // Core payment fields
      mchId: 'MG3518zo1Wd0XlXZzn', // Merchant ID
      appId: 'AX35182510130000001000103500', // App ID
      amountCent: Math.round(selectedBundle.price * 100), // JSAPI expects amountCent
      currency: 'USD', // Default currency (can be made dynamic)
      description: `Airtime purchase - ${selectedBundle.name} for ${phoneData?.recipientNumber || 'recipient'}`,
      callbackInfo: JSON.stringify(callbackData),
      outBizId: SuperAppPayment.generateOrderId('AIRTIME-'),
      timeExpire: SuperAppPayment.calculateExpiryTime(30), // JSAPI expects milliseconds
      paymentProduct: 'InAppH5', // Payment product type
    };
    
    this.log('data', '📦 Order Data', orderData);
    this.log('data', '📋 Callback Info (JSON String)', orderData.callbackInfo);
    
    // Validate JSON string
    try {
      const parsedCallback = JSON.parse(orderData.callbackInfo);
      this.log('success', '✅ Callback Info JSON is valid', parsedCallback);
    } catch (jsonError) {
      this.log('error', '❌ Callback Info JSON is invalid', {
        error: jsonError.message,
        callbackInfo: orderData.callbackInfo
      });
    }
    
    return orderData;
  }

  /**
   * Step 1: Prepare payment (create order + generate signature)
   */
  async preparePayment(orderData) {
    try {
      this.log('info', '📝 Step 1: Preparing payment (creating order + signature)...');
      this.log('info', '📋 Order Data Fields Being Sent:', {
        mchId: orderData.mchId,
        appId: orderData.appId,
        amountCent: orderData.amountCent,
        currency: orderData.currency,
        description: orderData.description,
        callbackInfo: 'JSON string with transaction details',
        outBizId: orderData.outBizId,
        timeExpire: orderData.timeExpire,
        paymentProduct: orderData.paymentProduct,
      });
      
      // Add timeout detection (2 minutes)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Payment preparation timeout after 2 minutes')), 120000);
      });
      
      this.log('info', '⏱️ Starting payment preparation with 2 min timeout...');
      const paymentResult = await Promise.race([
        this.superApp.preparePayment(orderData),
        timeoutPromise
      ]);
      
      // SuperAppPayment now logs API calls/responses directly
      this.log('success', '✅ Payment preparation completed');
      
      return paymentResult;
    } catch (prepareError) {
      this.log('error', '❌ Failed to prepare payment', {
        message: prepareError.message,
        name: prepareError.name,
        stack: prepareError.stack,
        response: prepareError.response,
        errorType: this.classifyError(prepareError)
      });
      throw prepareError;
    }
  }

  /**
   * Step 2: Show payment cashier
   */
  async showCashier(paymentResult) {
    try {
      this.log('info', '🏪 Step 2: Opening payment cashier...');
      
      // Validate paymentResult structure
      if (!paymentResult) {
        throw new Error('paymentResult is undefined');
      }
      if (!paymentResult.paymentParams) {
        throw new Error('paymentResult.paymentParams is undefined. Got: ' + JSON.stringify(paymentResult));
      }
      
      this.log('data', '📋 Payment Params for Cashier', paymentResult.paymentParams);
      
      // Check if window.payment.payOrder exists
      this.log('info', '🔍 Checking window.payment.payOrder availability...');
      if (!window.payment) {
        throw new Error('window.payment is not available');
      }
      if (typeof window.payment.payOrder !== 'function') {
        throw new Error('window.payment.payOrder is not a function. Available methods: ' + Object.keys(window.payment).join(', '));
      }
      this.log('success', '✅ window.payment.payOrder is available');
      
      this.log('info', '💳 Calling window.payment.payOrder...');
      
      // Show exactly what we're sending to payOrder (only 3 fields as per JSAPI spec)
      const PayOrderRequest = {
        rawData: paymentResult.paymentParams.rawData,
        paySign: paymentResult.paymentParams.paySign,
        signType: paymentResult.paymentParams.signType || 'SHA256withRSA'
      };
      
      this.log('data', '📦 PayOrderRequest (3 fields only):', {
        rawData: PayOrderRequest.rawData ? `${PayOrderRequest.rawData.substring(0, 50)}... (${PayOrderRequest.rawData.length} chars)` : 'MISSING',
        paySign: PayOrderRequest.paySign ? `${PayOrderRequest.paySign.substring(0, 50)}... (${PayOrderRequest.paySign.length} chars)` : 'MISSING',
        signType: PayOrderRequest.signType
      });
      
      // Add timeout for cashier call (2 minutes)
      const cashierTimeout = new Promise((_, reject) => {
        setTimeout(() => {
          this.log('error', '⏱️ TIMEOUT: window.payment.payOrder did not respond after 2 minutes');
          reject(new Error('Cashier call timeout after 2 minutes - window.payment.payOrder never responded'));
        }, 120000);
      });
      
      this.log('info', '⏳ Waiting for SuperApp cashier response (2 min timeout)...');
      
      // SuperAppPayment now logs window.payment.payOrder calls/responses directly
      const cashierResult = await Promise.race([
        this.superApp.showPaymentCashier(PayOrderRequest),
        cashierTimeout
      ]);
      
      this.log('success', '✅ Cashier completed successfully');
      
      return cashierResult;
    } catch (cashierError) {
      this.log('error', '❌ Failed to open cashier', {
        message: cashierError.message,
        name: cashierError.name,
        stack: cashierError.stack,
        errorType: this.classifyError(cashierError),
        source: 'SUPERAPP_CASHIER'
      });
      throw cashierError;
    }
  }

  /**
   * Step 3: Query payment status (optional)
   */
  async queryStatus(outBizId) {
    try {
      this.log('info', '🔍 Step 3: Querying payment status...');
      
      // SuperAppPayment now logs API calls/responses directly
      const statusResult = await this.superApp.queryPaymentResult(outBizId);
      
      this.log('success', '✅ Payment status query completed');
      
      return statusResult;
    } catch (statusError) {
      this.log('error', '⚠️ Failed to query status (non-critical)', {
        message: statusError.message || 'Unknown error',
        name: statusError.name || 'Error',
        stack: statusError.stack || 'No stack trace available'
      });
      // Don't throw - status query is optional
      return { error: 'Status query failed' };
    }
  }

  /**
   * Classify error type for better debugging
   */
  classifyError(error) {
    if (!error?.message) return 'UNKNOWN';
    
    const msg = error.message.toLowerCase();
    if (msg.includes('permission')) return 'PERMISSION_DENIED';
    if (msg.includes('denied')) return 'PERMISSION_DENIED';
    if (msg.includes('forbidden')) return 'FORBIDDEN';
    if (msg.includes('unauthorized')) return 'UNAUTHORIZED';
    if (msg.includes('not allowed')) return 'NOT_ALLOWED';
    if (msg.includes('timeout')) return 'TIMEOUT';
    
    return 'OTHER';
  }

  /**
   * Step 4: Post payment to AppleTree (for airtime fulfillment)
   * Only called if payment status is SUCCESS
   */
  async postPaymentToAppleTree(transactionId, phoneData, selectedBundle, userInfo = null, appleTreeService = null) {
    try {
      // Only proceed if AppleTree service is provided
      if (!appleTreeService) {
        this.log('info', 'ℹ️ AppleTree service not provided, skipping postPayment');
        return null;
      }

      this.log('info', '🌳 Step 4: Posting payment to AppleTree for airtime fulfillment...');
      
      const maxRetries = 5;
      const retryDelay = 3000; // 3 seconds in milliseconds
      let lastResult = null;
      
      // Attempt payment with retries
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        this.log('info', `🔄 AppleTree postPayment attempt ${attempt} of ${maxRetries}...`);
        
        // Build the payload using AppleTree service
        // IMPORTANT: Always pass null for requestId to ensure a NEW unique UUID is generated
        // for each call. This prevents "Unvalidated or duplicate transaction" errors.
        // Each payment attempt (including retries) must have a unique RequestId.
        const payload = appleTreeService.buildPostPaymentPayload({
          requestId: null, // Always generate NEW unique RequestId (UUID format) - never reuse
          selectedBundle,
          phoneData,
          userInfo
        });
        
        // Log the generated RequestId for this attempt
        this.log('info', `🔑 Generated new RequestId for attempt ${attempt}:`, payload.RequestId);
        
        if (attempt === 1) {
          this.log('data', '📦 AppleTree PostPayment Payload', payload);
        }
        
        // Post payment to AppleTree
        const appleTreeResult = await appleTreeService.postPayment(payload);
        lastResult = appleTreeResult;
        
        // Log result based on status
        if (appleTreeResult.success) {
          this.log('success', `✅ AppleTree postPayment completed successfully on attempt ${attempt}`, {
            status: appleTreeResult.status,
            referenceNumber: appleTreeResult.referenceNumber,
            vouchersCount: appleTreeResult.vouchers?.length || 0,
            requestId: appleTreeResult.requestId
          });
          return appleTreeResult; // Success - return immediately
        } else if (appleTreeResult.isFailedRepeatable) {
          // Failed but repeatable - retry if attempts remain
          this.log('warning', `⚠️ AppleTree postPayment failed (repeatable) on attempt ${attempt}`, {
            status: appleTreeResult.status,
            message: appleTreeResult.resultMessage,
            requestId: appleTreeResult.requestId,
            attemptsRemaining: maxRetries - attempt
          });
          
          // If this is not the last attempt, wait before retrying
          if (attempt < maxRetries) {
            this.log('info', `⏳ Waiting ${retryDelay / 1000} seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            this.log('error', `❌ AppleTree postPayment failed after ${maxRetries} attempts (all repeatable)`, {
              status: appleTreeResult.status,
              message: appleTreeResult.resultMessage,
              requestId: appleTreeResult.requestId
            });
          }
        } else {
          // Failed and not repeatable - don't retry
          this.log('error', `❌ AppleTree postPayment failed (non-repeatable) on attempt ${attempt}`, {
            status: appleTreeResult.status,
            message: appleTreeResult.resultMessage || appleTreeResult.error,
            requestId: appleTreeResult.requestId
          });
          return appleTreeResult; // Return immediately for non-repeatable failures
        }
      }
      
      // All retries exhausted - return last result
      return lastResult || { error: 'All retry attempts failed', success: false, isFailedRepeatable: true };
    } catch (error) {
      this.log('error', '❌ Failed to post payment to AppleTree (non-critical)', {
        message: error.message || 'Unknown error',
        name: error.name || 'Error',
        stack: error.stack || 'No stack trace available'
      });
      // Don't throw - AppleTree postPayment is non-critical for payment completion
      return { error: error.message, success: false };
    }
  }

  /**
   * Main payment execution flow
   * Orchestrates all steps: initialize → prepare → cashier → status → AppleTree postPayment
   */
  async executePayment(phoneData, selectedBundle, options = {}) {
    try {
      this.log('info', '------- Payment Attempt Started -------');
      this.log('info', '🚀 Initiating payment with SuperApp payment system...');
      
      // Setup error handlers
      this.setupErrorHandlers();
      
      // Initialize SuperApp
      await this.initialize();
      
      // Build order data
      const orderData = this.buildOrderData(phoneData, selectedBundle);
      
      // Step 1: Prepare payment
      const paymentResult = await this.preparePayment(orderData);
      
      // Step 2: Show cashier
      const cashierResult = await this.showCashier(paymentResult);
      
      // Step 3: Query status (optional)
      const statusResult = await this.queryStatus(paymentResult.outBizId);
      
      // Check if payment was successful
      const paymentStatus = statusResult?.orderStatus || statusResult?.status || cashierResult?.status;
      const isPaymentSuccessful = paymentStatus === ORDER_STATUS.SUCCESS;
      
      this.log('success', '✅ Payment completed successfully!');
      
      // Step 4: Post payment to AppleTree if payment was successful (optional)
      let appleTreeResult = null;
      if (isPaymentSuccessful && options.postToAppleTree !== false) {
        // Call callback if provided to notify that voucher fetching is starting
        if (options.onVoucherFetchStart && typeof options.onVoucherFetchStart === 'function') {
          options.onVoucherFetchStart();
        }
        
        appleTreeResult = await this.postPaymentToAppleTree(
          paymentResult.outBizId,
          phoneData,
          selectedBundle,
          options.userInfo || null,
          options.appleTreeService || null
        );
      }
      
      // Return complete payment data
      return {
        success: true,
        transactionId: paymentResult.outBizId,
        prepayId: paymentResult.prepayId,
        timestamp: new Date().toISOString(),
        cashierResult,
        statusResult,
        paymentResult,
        appleTreeResult,
        paymentStatus
      };
    } catch (error) {
      // Log the full error object with safe property access
      this.log('error', '❌ Payment Failed', {
        message: error?.message || 'Unknown error',
        name: error?.name || 'Error',
        stack: error?.stack || 'No stack trace available',
        fullError: error,
        errorType: this.classifyError(error)
      });
      
      throw error;
    }
  }
}

export default PaymentFlowManager;

