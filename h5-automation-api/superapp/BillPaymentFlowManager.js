import SuperAppPayment from './SuperAppPayment.js';
import { ORDER_STATUS } from './statusService.js';
import AppleTreeGateway from '../appletree/AppleTreeGateway.js';
import PostPayment from '../appletree/postPayment.js';

/**
 * BillPaymentFlowManager - Orchestrates the complete bill payment flow
 * Adapted from PaymentFlowManager for bill payments (electricity, water, etc.)
 * Separates business logic from UI components for better maintainability
 */
class BillPaymentFlowManager {
  constructor(logCallback = null) {
    this.logCallback = logCallback || (() => {});
    this.superApp = null;
    this.appleTreeGateway = null;
    this.postPaymentService = null;
  }

  /**
   * Helper to send logs back to UI
   * Logs all types when logCallback is provided (debug mode)
   */
  log(type, message, data = null) {
    if (this.logCallback) {
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
   * Initialize SuperApp payment system and AppleTree Gateway
   */
  async initialize() {
    try {
      this.log('info', '🔧 Initializing SuperAppPayment class...');
      this.superApp = new SuperAppPayment({ logger: this.logCallback });
      this.log('success', '✅ SuperAppPayment initialized');

      // Initialize AppleTree Gateway for PostPayment
      this.appleTreeGateway = new AppleTreeGateway({
        merchantId: '23de4621-ea24-433f-9b45-dc1e383d8c2b',
        baseUrl: 'https://sandbox-dev.appletreepayments.com',
        apiVersion: 'V2'
      });

      // Initialize PostPayment service
      // Note: PostPayment endpoint uses /billpayments/v2/postpayment path (different from other VAS endpoints)
      // Using the same baseUrl but with billpayments path as per Postman collection
      const postPaymentBaseUrl = 'https://sandbox-apg.azurewebsites.net'; // Different base URL for PostPayment
      const postPaymentUrl = `${postPaymentBaseUrl}/billpayments/v2/postpayment`;
      this.postPaymentService = new PostPayment(postPaymentUrl, this.appleTreeGateway.merchantId);
      this.log('success', '✅ AppleTree Gateway and PostPayment service initialized');

      return this.superApp;
    } catch (initError) {
      this.log('error', '❌ Failed to initialize payment system', {
        message: initError.message,
        name: initError.name,
        stack: initError.stack
      });
      throw initError;
    }
  }

  /**
   * Build and validate callback data for bill payments
   */
  buildCallbackData(paymentData) {
    const { country, service, provider, product, accountValue, amount, validationData } = paymentData;

    // Extract account name from validation data if available
    let accountName = accountValue;
    if (validationData?.DisplayData) {
      const accountNameItem = validationData.DisplayData.find(item => 
        item.Label?.toLowerCase().includes('account name') || 
        item.Label?.toLowerCase().includes('name')
      );
      if (accountNameItem?.Value) {
        accountName = accountNameItem.Value;
      }
    }

    const callbackData = {
      country: country?.countryName || 'Unknown',
      service: service?.Name || 'Unknown',
      provider: provider?.Name || 'Unknown',
      product: product?.Name || 'Unknown',
      productId: product?.Id || 'N/A',
      accountNumber: accountValue || 'N/A',
      accountName: accountName,
      amount: amount || 'N/A',
      currency: product?.Currency || 'USD',
      paymentType: 'Bill Payment'
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
   * Build order data for bill payment
   */
  buildOrderData(paymentData) {
    const { product, accountValue, amount } = paymentData;
    const callbackData = this.buildCallbackData(paymentData);
    
    const currency = product?.Currency || 'USD';
    const amountCent = Math.round(amount * 100); // Convert to cents

    const orderData = {
      // Core payment fields
      mchId: 'MG3518zo1Wd0XlXZzn', // Merchant ID
      appId: 'AE35182511050000001000105000', // Bill Payments App ID
      amountCent: amountCent, // JSAPI expects amountCent
      currency: currency,
      description: `Bill payment - ${product?.Name || 'Bill'} for account ${accountValue || 'N/A'}`,
      callbackInfo: JSON.stringify(callbackData),
      outBizId: SuperAppPayment.generateOrderId('BILL-'),
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
   * Build PostPayment payload for AppleTree Gateway
   */
  buildPostPaymentPayload(paymentData, transactionId, userInfo = null) {
    const { product, accountValue, amount, validationData } = paymentData;

    // Get credit party identifier info from product
    const creditPartyIdentifier = product?.CreditPartyIdentifiers?.[0];
    const identifierFieldName = creditPartyIdentifier?.Name || 'AccountNumber';

    // Get customer details from userInfo or use defaults
    const customerDetails = userInfo ? {
      CustomerId: userInfo.CustomerId || userInfo.openId || '1L',
      Fullname: userInfo.Fullname || userInfo.userInfo?.msisdn || '1L',
      MobileNumber: userInfo.MobileNumber || userInfo.phoneNumber || userInfo.userInfo?.msisdn || '+263777077921',
      EmailAddress: userInfo.EmailAddress || null
    } : {
      CustomerId: '1L',
      Fullname: '1L',
      MobileNumber: '+263777077921',
      EmailAddress: null
    };

    // Generate new RequestId for PostPayment (must be unique UUID)
    const requestId = AppleTreeGateway.generateRequestId();

    const payload = {
      RequestId: requestId,
      PaymentChannel: 'SuperApp',
      PaymentReferenceNumber: transactionId || 'N/A', // From SuperApp payment
      ProductId: product?.Id,
      BillReferenceNumber: null, // Optional, can be null
      Quantity: '1', // String format as per API spec
      Currency: product?.Currency || 'USD',
      Amount: amount,
      CustomerDetails: customerDetails,
      CreditPartyIdentifiers: [
        {
          IdentifierFieldName: identifierFieldName,
          IdentifierFieldValue: accountValue
        }
      ],
      POSDetails: {
        StoreId: 'SuperApp',
        TerminalId: 'SuperApp',
        CashierId: 'SuperApp'
      }
    };

    this.log('data', '📦 PostPayment Payload', payload);
    return payload;
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
   * Step 4: Post payment to AppleTree (for bill payment fulfillment)
   * Only called if payment status is SUCCESS
   */
  async postPaymentToAppleTree(transactionId, paymentData, userInfo = null) {
    try {
      // Only proceed if PostPayment service is initialized
      if (!this.postPaymentService) {
        this.log('info', 'ℹ️ PostPayment service not initialized, skipping postPayment');
        return null;
      }

      this.log('info', '🌳 Step 4: Posting payment to AppleTree for bill payment fulfillment...');
      
      const maxRetries = 5;
      const retryDelay = 3000; // 3 seconds in milliseconds
      let lastResult = null;
      
      // Attempt payment with retries
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        this.log('info', `🔄 AppleTree postPayment attempt ${attempt} of ${maxRetries}...`);
        
        // Build the payload for bill payments
        // IMPORTANT: Always generate a NEW unique RequestId for each call
        // Each payment attempt (including retries) must have a unique RequestId.
        const payload = this.buildPostPaymentPayload(paymentData, transactionId, userInfo);
        
        // Log the generated RequestId for this attempt
        this.log('info', `🔑 Generated new RequestId for attempt ${attempt}:`, payload.RequestId);
        
        if (attempt === 1) {
          this.log('data', '📦 AppleTree PostPayment Payload', payload);
        }
        
        try {
          // Post payment to AppleTree
          const appleTreeResult = await this.postPaymentService.postPayment(payload);
          lastResult = appleTreeResult;
          
          // Check if result is successful
          const isSuccess = appleTreeResult.Status === 'SUCCESSFUL';
          const isFailedRepeatable = appleTreeResult.Status === 'FAILEDREPEATABLE' || 
                                     appleTreeResult.Status === 'PROCESSING';
          
          // Log result based on status
          if (isSuccess) {
            this.log('success', `✅ AppleTree postPayment completed successfully on attempt ${attempt}`, {
              status: appleTreeResult.Status,
              referenceNumber: appleTreeResult.ReferenceNumber,
              requestId: appleTreeResult.RequestId,
              hasDisplayData: !!appleTreeResult.DisplayData,
              hasReceiptHTML: !!appleTreeResult.ReceiptHTML,
              hasReceiptSmses: !!appleTreeResult.ReceiptSmses
            });
            return {
              success: true,
              status: appleTreeResult.Status,
              referenceNumber: appleTreeResult.ReferenceNumber,
              requestId: appleTreeResult.RequestId,
              displayData: appleTreeResult.DisplayData || [],
              vouchers: appleTreeResult.Vouchers || [],
              receiptHTML: appleTreeResult.ReceiptHTML || [],
              receiptSmses: appleTreeResult.ReceiptSmses || [],
              resultMessage: appleTreeResult.ResultMessage
            }; // Success - return immediately
          } else if (isFailedRepeatable) {
            // Failed but repeatable - retry if attempts remain
            this.log('warning', `⚠️ AppleTree postPayment failed (repeatable) on attempt ${attempt}`, {
              status: appleTreeResult.Status,
              message: appleTreeResult.ResultMessage,
              requestId: appleTreeResult.RequestId,
              attemptsRemaining: maxRetries - attempt
            });
            
            // If this is not the last attempt, wait before retrying
            if (attempt < maxRetries) {
              this.log('info', `⏳ Waiting ${retryDelay / 1000} seconds before retry...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
              this.log('error', `❌ AppleTree postPayment failed after ${maxRetries} attempts (all repeatable)`, {
                status: appleTreeResult.Status,
                message: appleTreeResult.ResultMessage,
                requestId: appleTreeResult.RequestId
              });
            }
          } else {
            // Failed and not repeatable - don't retry
            this.log('error', `❌ AppleTree postPayment failed (non-repeatable) on attempt ${attempt}`, {
              status: appleTreeResult.Status,
              message: appleTreeResult.ResultMessage || appleTreeResult.error,
              requestId: appleTreeResult.RequestId
            });
            return {
              success: false,
              status: appleTreeResult.Status,
              resultMessage: appleTreeResult.ResultMessage,
              requestId: appleTreeResult.RequestId,
              isFailedRepeatable: false
            }; // Return immediately for non-repeatable failures
          }
        } catch (postError) {
          // Network or parsing error - treat as repeatable
          this.log('warning', `⚠️ AppleTree postPayment error (repeatable) on attempt ${attempt}`, {
            error: postError.message,
            attemptsRemaining: maxRetries - attempt
          });
          
          if (attempt < maxRetries) {
            this.log('info', `⏳ Waiting ${retryDelay / 1000} seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            this.log('error', `❌ AppleTree postPayment failed after ${maxRetries} attempts (all errors)`, {
              error: postError.message
            });
          }
        }
      }
      
      // All retries exhausted - return last result
      return lastResult || { 
        error: 'All retry attempts failed', 
        success: false, 
        isFailedRepeatable: true 
      };
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
  async executePayment(paymentData, options = {}) {
    try {
      this.log('info', '------- Bill Payment Attempt Started -------');
      this.log('info', '🚀 Initiating bill payment with SuperApp payment system...');
      
      // Setup error handlers
      this.setupErrorHandlers();
      
      // Initialize SuperApp and AppleTree
      await this.initialize();
      
      // Build order data
      const orderData = this.buildOrderData(paymentData);
      
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
        // Call callback if provided to notify that fulfillment is starting
        if (options.onFulfillmentStart && typeof options.onFulfillmentStart === 'function') {
          options.onFulfillmentStart();
        }
        
        appleTreeResult = await this.postPaymentToAppleTree(
          paymentResult.outBizId,
          paymentData,
          options.userInfo || null
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

export default BillPaymentFlowManager;

