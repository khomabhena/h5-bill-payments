import SuperAppPayment from './SuperAppPayment.js';
import { ORDER_STATUS } from './statusService.js';
import { submitPostPayment } from '../appletree/appleTreeService.js';

/**
 * BillPaymentFlowManager - Orchestrates the complete bill payment flow
 * Adapted from PaymentFlowManager for bill payments (electricity, water, etc.)
 * Separates business logic from UI components for better maintainability
 */
class BillPaymentFlowManager {
  constructor(logCallback = null) {
    this.logCallback = logCallback || (() => {});
    this.superApp = null;
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
      this.log('info', '🔧 Initializing SuperAppPayment class with Bill Payments credentials...');
      this.superApp = new SuperAppPayment({
        logger: this.logCallback,
        merchantId: 'MG3518zo1Wd0XlXZzn',
        appId: 'AX35182510130000001000103500',
        serialNo: 'ms8I46zJeW'
      });
      this.log('success', '✅ SuperAppPayment initialized');

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
    const { product, accountValue, amount, validationData } = paymentData;
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

    this.log('data', '📋 PrepayId Order Data (ready for SuperApp API)', {
      amountCent,
      currency,
      description: orderData.description,
      outBizId: orderData.outBizId,
      timeExpire: orderData.timeExpire,
      callbackInfo: callbackData,
      paymentProduct: orderData.paymentProduct,
      productId: product?.Id,
      accountValue,
      validationStatus: validationData?.Status
    });

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
   * Build the payload required for AppleTree PostPayment
   */
  buildPostPaymentPayload(paymentData, transactionId, validationData, userInfo = null) {
    const { product, accountValue, amount } = paymentData;
    const requestId = validationData?.RequestId || validationData?.requestId || null;

    const creditPartyIdentifier = product?.CreditPartyIdentifiers?.[0] || {};
    const identifierFieldName =
      creditPartyIdentifier?.IdentifierFieldName ||
      creditPartyIdentifier?.Name ||
      creditPartyIdentifier?.FieldName ||
      'AccountNumber';

    const currencyCode = (
      validationData?.Currency ||
      product?.Currency ||
      paymentData?.currency ||
      'USD'
    )
      .toString()
      .toUpperCase();

    const deriveAccountNameFromDisplay = () => {
      if (validationData?.DisplayData) {
        const nameEntry = validationData.DisplayData.find((item = {}) => {
          const label = item.Label?.toLowerCase() || '';
          return label.includes('name');
        });
        if (nameEntry?.Value) {
          return nameEntry.Value;
        }
      }
      return accountValue || 'Customer';
    };

    const fullName =
      userInfo?.Fullname ||
      userInfo?.FullName ||
      userInfo?.userInfo?.fullName ||
      userInfo?.userInfo?.name ||
      deriveAccountNameFromDisplay();

    const customerDetails = {
      CustomerId:
        userInfo?.CustomerId ||
        userInfo?.openId ||
        userInfo?.userInfo?.userId ||
        userInfo?.userInfo?.id ||
        '1L',
      FullName: fullName,
      Fullname: fullName,
      MobileNumber:
        userInfo?.MobileNumber ||
        userInfo?.phoneNumber ||
        userInfo?.userInfo?.msisdn ||
        userInfo?.userInfo?.phoneNumber ||
        userInfo?.userInfo?.phone ||
        '+263777077921',
      EmailAddress:
        userInfo?.EmailAddress ||
        userInfo?.userInfo?.email ||
        userInfo?.userInfo?.emailAddress ||
        null
    };

    const posDetails = {
      CashierId: validationData?.POSDetails?.CashierId || '1L',
      StoreId: validationData?.POSDetails?.StoreId || '1L',
      TerminalId: validationData?.POSDetails?.TerminalId || '1L'
    };

    return {
      RequestId: requestId,
      ProductId: product?.Id,
      BillReferenceNumber:
        validationData?.BillReferenceNumber ??
        validationData?.billReferenceNumber ??
        null,
      PaymentChannel: 'Mobile',
      PaymentReferenceNumber: transactionId || 'N/A',
      Quantity: '1',
      Currency: currencyCode,
      Amount: typeof amount === 'number' ? amount : Number(amount) || 0,
      CustomerDetails: customerDetails,
      CreditPartyIdentifiers: [
        {
          IdentifierFieldName: identifierFieldName,
          IdentifierFieldValue:
            accountValue !== undefined && accountValue !== null
              ? String(accountValue)
              : null
        }
      ],
      POSDetails: posDetails
    };
  }

  /**
   * Post payment to AppleTree: requires prior validation (VALIDATED status)
   */
  async postPaymentToAppleTree(transactionId, paymentData, validationData, userInfo = null) {
    if (!validationData || validationData.Status !== 'VALIDATED') {
      this.log('info', 'ℹ️ Validation not successful or missing; skipping AppleTree PostPayment.', {
        validationStatus: validationData?.Status
      });
      return null;
    }

    if (!validationData.RequestId && !validationData.requestId) {
      this.log('error', '⚠️ Validation response missing RequestId; cannot post payment.', validationData);
      return {
        success: false,
        status: 'MISSING_REQUEST_ID',
        resultMessage: 'Validation response missing RequestId.',
        _requestPayload: null
      };
    }

    const payload = this.buildPostPaymentPayload(paymentData, transactionId, validationData, userInfo);

    this.log('info', '🌳 Step 4: Posting payment to AppleTree for fulfillment...', {
      requestId: payload.RequestId,
      productId: payload.ProductId
    });
    this.log('data', '📦 AppleTree PostPayment Payload', payload);

    try {
      const response = await submitPostPayment(payload);
      const status = response?.Status || response?.status;
      const normalized = {
        status,
        resultMessage: response?.ResultMessage || response?.ResultInformation || null,
        referenceNumber: response?.ReferenceNumber || null,
        requestId: response?.RequestId || payload.RequestId,
        displayData: response?.DisplayData || [],
        vouchers: response?.Vouchers || [],
        receiptHTML: response?.ReceiptHTML || [],
        receiptSmses: response?.ReceiptSmses || [],
        success: status === 'SUCCESSFUL',
        isFailedRepeatable: status === 'FAILEDREPEATABLE',
        raw: response,
        _requestPayload: payload
      };

      if (normalized.success) {
        this.log('success', '✅ AppleTree PostPayment succeeded.', {
          referenceNumber: normalized.referenceNumber,
          requestId: normalized.requestId,
          vouchers: normalized.vouchers.length,
          receipts: normalized.receiptHTML.length
        });
      } else if (normalized.isFailedRepeatable) {
        this.log('warning', '⚠️ AppleTree PostPayment returned FAILEDREPEATABLE.', {
          requestId: normalized.requestId,
          message: normalized.resultMessage
        });
      } else {
        this.log('error', '❌ AppleTree PostPayment failed.', {
          requestId: normalized.requestId,
          message: normalized.resultMessage
        });
      }

      return normalized;
    } catch (error) {
      this.log('error', '❌ AppleTree PostPayment error.', {
        message: error?.message,
        debug: error?.debugInfo
      });
      return {
        success: false,
        status: 'ERROR',
        resultMessage: error?.message || 'PostPayment error',
        requestId: payload.RequestId,
        referenceNumber: null,
        displayData: [],
        vouchers: [],
        receiptHTML: [],
        receiptSmses: [],
        error,
        _requestPayload: payload
      };
    }
  }

  /**
   * Main payment execution flow
   * Orchestrates all steps: initialize → prepare → cashier → status → PostPayment
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
      
      // Step 4: Post payment to AppleTree if payment was successful
      let postPaymentResult = null;
      if (isPaymentSuccessful) {
        postPaymentResult = await this.postPaymentToAppleTree(
          paymentResult.outBizId,
          paymentData,
          paymentData?.validationData,
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
        postPaymentResult,
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

