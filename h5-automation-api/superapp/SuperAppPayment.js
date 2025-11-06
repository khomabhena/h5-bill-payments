/**
 * SuperApp Payment - Production Ready
 * For React/ES6 applications
 * 
 * @example
 * import SuperAppPayment from './SuperAppPayment';
 * 
 * const payment = new SuperAppPayment({ 
 *   merchantId, appId, serialNo, merchantPrivateKey 
 * });
 * const result = await payment.preparePayment({ amount: 100, currency: 'USD' });
 */

import StatusService, { ORDER_STATUS } from './statusService.js';

export default class SuperAppPayment {
  constructor(config = {}) {
    // Default credentials (can be overridden)
    this.merchantId = config.merchantId || 'MG3518zo1Wd0XlXZzn';
    this.appId = config.appId || 'AX35182510130000001000103500';
    this.serialNo = config.serialNo || 'ms8I46zJeW';
    this.merchantPrivateKey = config.merchantPrivateKey || `-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----`;
    
    this.baseUrl = config.baseUrl || 'https://appleseed-uat-api.joypaydev.com';
    this.notifyUrl = config.notifyUrl;
    this.redirectUrl = config.redirectUrl;
    
    // Initialize StatusService for payment status checking
    this.statusService = new StatusService();
    
    // Logger callback for errors only (production mode)
    this.logger = config.logger || (() => {});
  }
  
  log(type, message, data = null) {
    // Only log errors in production
    if (type === 'error') {
      this.logger(type, message, data);
    }
  }

  generateNonce(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }

  generateTimestamp() {
    return Math.floor(Date.now() / 1000);
  }

  buildMessage(method, url, timestamp, nonceStr, body) {
    const urlObj = new URL(url);
    const canonicalUrl = urlObj.pathname + (urlObj.search || '');
    return `${method}\n${canonicalUrl}\n${timestamp}\n${nonceStr}\n${body}\n`;
  }

  pemToArrayBuffer(pem) {
    // Keep PEM as-is (with BEGIN/END markers). Extract Base64 between markers at runtime.
    // Supports PKCS#8 (PRIVATE KEY) and PKCS#1 (RSA PRIVATE KEY)
    const match = /-----BEGIN [^-]+-----([\s\S]*?)-----END [^-]+-----/m.exec(pem);
    const base64Body = (match ? match[1] : pem).replace(/\s+/g, '');

    // Decode Base64 to bytes (browser atob). If unavailable, try Buffer.
    let bytes;
    if (typeof atob === 'function') {
      const binaryString = atob(base64Body);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    } else if (typeof Buffer !== 'undefined') {
      const buf = Buffer.from(base64Body, 'base64');
      bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    } else {
      throw new Error('No Base64 decoder available for PEM key');
    }
    return bytes.buffer;
  }

  async signRSA(message) {
    const keyData = this.pemToArrayBuffer(this.merchantPrivateKey);
    
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, data);
    
    const signatureArray = new Uint8Array(signature);
    let binary = '';
    for (let i = 0; i < signatureArray.length; i++) {
      binary += String.fromCharCode(signatureArray[i]);
    }
    return btoa(binary);
  }

  async buildAuthorizationHeader(method, url, body) {
    const nonceStr = this.generateNonce();
    const timestamp = this.generateTimestamp();
    const message = this.buildMessage(method, url, timestamp, nonceStr, body);
    const signature = await this.signRSA(message);

    return `SHA256withRSA mchid="${this.merchantId}",` +
           `serial_no="${this.serialNo}",` +
           `nonce_str="${nonceStr}",` +
           `timestamp="${timestamp}",` +
           `signature="${signature}"`;
  }

  async generatePaymentSignature(prepayId) {
    const nonce = this.generateNonce();
    const timestamp = this.generateTimestamp();
    
    // Build string with clean newlines (no %5Cn encoding)
    const parts = [this.merchantId, this.appId, nonce, timestamp, this.serialNo, prepayId];
    const baseString = parts.join("\n") + "\n";
    
    // Sign the base string
    const signature = await this.signRSA(baseString);

    return {
      // rawData with clean newlines (URL-encoded to %0A)
      rawData: encodeURIComponent(baseString),
      paySign: signature,
      signType: 'SHA256withRSA'
    };
  }

  async createOrder(orderData) {
    const url = `${this.baseUrl}/v1/pay/pre-transaction/order/place`;
    
    // Normalize expiry: accept seconds or milliseconds, send milliseconds
    let normalizedExpire = orderData.timeExpire || SuperAppPayment.calculateExpiryTime(30);
    if (typeof normalizedExpire === 'number' && normalizedExpire < 1e12) {
      normalizedExpire = normalizedExpire * 1000;
    }

    if (orderData.amountCent == null) {
      throw new Error('amountCent is required for JSAPI prepay');
    }

    const requestBody = {
      mchId: this.merchantId,
      appId: this.appId,
      outBizId: orderData.outBizId || SuperAppPayment.generateOrderId(),
      amount: orderData.amountCent, // API expects 'amount' field, not 'amountCent'
      currency: orderData.currency,
      description: orderData.description || '',
      timeExpire: normalizedExpire,
      callbackInfo: orderData.callbackInfo || '',
      paymentProduct: 'InAppH5'
    };

    // notifyUrl and redirectUrl intentionally omitted

    const body = JSON.stringify(requestBody);
    const authHeader = await this.buildAuthorizationHeader('POST', url, body);

    // Log the API request
    this.log('info', '📤 [API CALL] POST /v1/pay/pre-transaction/order/place', {
      endpoint: url,
      method: 'POST',
      requestBody: requestBody,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader.substring(0, 50) + '...'
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body
    });

    const responseText = await response.text();

    // Log the API response
    if (!response.ok) {
      this.log('error', '❌ [API RESPONSE] Create Order FAILED', {
        httpStatus: response.status,
        httpStatusText: response.statusText,
        responseBody: responseText,
        source: 'AppleSeed API'
      });
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    const result = JSON.parse(responseText);

    this.log('success', '✅ [API RESPONSE] Create Order SUCCESS', {
      httpStatus: response.status,
      responseBody: result,
      prepayId: result.prepayId || 'MISSING',
      prepayIdLength: result.prepayId ? result.prepayId.length : 0,
      source: 'AppleSeed API'
    });
    
    if (!result.prepayId) {
      throw new Error(`No prepayId in API response: ${JSON.stringify(result)}`);
    }
    
    return {
      prepayId: result.prepayId,
      outBizId: requestBody.outBizId,
      orderData: requestBody
    };
  }

  async preparePayment(orderData) {
    const order = await this.createOrder(orderData);
    const paymentParams = await this.generatePaymentSignature(order.prepayId);
    
    return {
      prepayId: order.prepayId,
      outBizId: order.outBizId,
      paymentParams,
      orderData: order.orderData
    };
  }

  async queryPaymentResult(outBizId) {
    if (!outBizId) throw new Error('outBizId is required');
    
    const url = `${this.baseUrl}/v1/pay/transaction/result`;
    const body = JSON.stringify({ outBizId });
    const authHeader = await this.buildAuthorizationHeader('POST', url, body);

    // Log the API request
    this.log('info', '📤 [API CALL] POST /v1/pay/transaction/result', {
      endpoint: url,
      method: 'POST',
      requestBody: { outBizId },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader.substring(0, 50) + '...'
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body
    });

    const responseText = await response.text();
    
    // Log the API response
    if (!response.ok) {
      this.log('error', '❌ [API RESPONSE] Query Payment Status FAILED', {
        httpStatus: response.status,
        httpStatusText: response.statusText,
        responseBody: responseText,
        source: 'AppleSeed API'
      });
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    
    this.log('success', '✅ [API RESPONSE] Query Payment Status SUCCESS', {
      httpStatus: response.status,
      responseBody: result,
      source: 'AppleSeed API'
    });

    return result;
  }

  async getAuthToken() {
    if (!window.payment) {
      throw new Error('window.payment API not available');
    }
    const result = await window.payment.getAuthToken({ appId: this.appId });
    return result.authToken;
  }

  async showPaymentCashier(paymentParams) {
    if (!window.payment) {
      throw new Error('window.payment API not available');
    }
    
    // Format PayOrderRequest exactly as per JSAPI documentation
    const PayOrderRequest = {
      rawData: paymentParams.rawData,
      paySign: paymentParams.paySign,
      signType: paymentParams.signType || 'SHA256withRSA'
    };
    
    // Log the SuperApp SDK call
    this.log('info', '📤 [SUPERAPP CALL] window.payment.payOrder', {
      method: 'window.payment.payOrder',
      parameters: PayOrderRequest,
      source: 'SuperApp JS SDK'
    });
    
    // Return a Promise that wraps the .then().catch() pattern from the documentation
    return new Promise((resolve, reject) => {
      // Add timeout to prevent infinite hanging (2 minutes)
      const timeout = setTimeout(() => {
        this.log('error', '⏱️ [SUPERAPP TIMEOUT] window.payment.payOrder did not respond', {
          timeout: '2 minutes',
          source: 'SuperApp JS SDK'
        });
        reject(new Error('Payment cashier timeout after 2 minutes'));
      }, 120000);
      
      window.payment
        .payOrder(PayOrderRequest)
        .then(res => {
          clearTimeout(timeout);
          // Success callback - log the raw response
          this.log('success', '✅ [SUPERAPP RESPONSE] window.payment.payOrder SUCCESS', {
            rawResponse: res,
            responseType: typeof res,
            responseKeys: res && typeof res === 'object' ? Object.keys(res) : 'N/A',
            source: 'SuperApp JS SDK'
          });
          resolve(res);
        })
        .catch(error => {
          clearTimeout(timeout);
          // Failure callback - log the raw error
          this.log('error', '❌ [SUPERAPP RESPONSE] window.payment.payOrder FAILED', {
            rawError: error,
            errorMessage: error?.message || 'No message',
            errorName: error?.name || 'Unknown',
            errorStack: error?.stack || 'No stack trace',
            errorType: typeof error,
            source: 'SuperApp JS SDK'
          });
          reject(error);
        });
    });
  }

  /**
   * Check payment status after cashier is pulled
   * @param {string} bizId - Business transaction identifier from payment response
   * @param {string} orderId - Order identifier (optional)
   * @param {string} authToken - Authentication token
   * @returns {Promise<Object>} Payment status result
   */
  async checkPaymentStatus(bizId, orderId = null, authToken = null) {
    try {
      // Get auth token if not provided
      if (!authToken) {
        authToken = await this.getAuthToken();
      }

      this.log('info', '🔍 [STATUS CHECK] Checking payment status', {
        bizId,
        orderId,
        source: 'StatusService'
      });

      const statusResult = await this.statusService.queryPaymentStatus(
        { bizId, orderId },
        authToken
      );

      this.log('info', '✅ [STATUS RESULT] Payment status retrieved', {
        status: statusResult.status || statusResult.orderStatus,
        bizId,
        orderId,
        result: statusResult,
        source: 'StatusService'
      });

      return {
        success: true,
        status: statusResult.status || statusResult.orderStatus,
        data: statusResult,
        bizId,
        orderId
      };

    } catch (error) {
      this.log('error', '❌ [STATUS ERROR] Payment status check failed', {
        error: error.message,
        bizId,
        orderId,
        source: 'StatusService'
      });
      
      return {
        success: false,
        error: error.message,
        bizId,
        orderId
      };
    }
  }

  /**
   * Complete payment flow with status checking
   * @param {Object} paymentParams - Payment parameters
   * @returns {Promise<Object>} Complete payment result with status
   */
  async processPaymentWithStatusCheck(paymentParams) {
    try {
      // Step 1: Show payment cashier
      this.log('info', '💳 [PAYMENT START] Processing payment with status check', {
        orderId: paymentParams.orderId,
        amount: paymentParams.amount,
        source: 'SuperAppPayment'
      });

      const paymentResult = await this.showPaymentCashier(paymentParams);
      
      // Extract bizId from payment result
      const bizId = paymentResult.bizId || paymentResult.orderId || paymentParams.orderId;
      
      if (!bizId) {
        throw new Error('No bizId found in payment result for status checking');
      }

      // Step 2: Check payment status
      const statusResult = await this.checkPaymentStatus(bizId, paymentParams.orderId);

      return {
        success: true,
        paymentResult,
        statusResult,
        bizId,
        orderId: paymentParams.orderId,
        finalStatus: statusResult.status
      };

    } catch (error) {
      this.log('error', '❌ [PAYMENT ERROR] Payment processing failed', {
        error: error.message,
        orderId: paymentParams.orderId,
        source: 'SuperAppPayment'
      });
      
      return {
        success: false,
        error: error.message,
        orderId: paymentParams.orderId
      };
    }
  }

  static generateOrderId(prefix = 'ORDER-') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}${timestamp}${random}`;
  }

  static calculateExpiryTime(minutes = 30) {
    return Date.now() + (minutes * 60 * 1000);
  }
}

// Export ORDER_STATUS constants for external use
export { ORDER_STATUS };

