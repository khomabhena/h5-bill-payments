/**
 * PostPayment Service
 * Handles posting payment to AppleTree aggregator after successful SuperApp payment
 */

export default class PostPayment {
  constructor(baseUrl, merchantId) {
    this.baseUrl = baseUrl;
    this.merchantId = merchantId;
  }

  async postPayment(body) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'MerchantId': this.merchantId
    };

    // Store debug info
    const debugInfo = {
      url: this.baseUrl,
      method: 'POST',
      headers: { ...headers }, // Copy headers
      payload: body,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    // Add response debug info
    debugInfo.responseStatus = response.status;
    debugInfo.responseStatusText = response.statusText;
    debugInfo.responseHeaders = {};
    
    // Extract response headers
    response.headers.forEach((value, key) => {
      debugInfo.responseHeaders[key] = value;
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        debugInfo.responseBody = errorText;
        const error = new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        error.debugInfo = debugInfo;
        throw error;
      }
      debugInfo.responseBody = errorJson;
      const error = new Error(errorJson.ResultMessage || `HTTP error! status: ${response.status}`);
      error.debugInfo = debugInfo;
      throw error;
    }

    const responseData = await response.json();
    debugInfo.responseBody = responseData;
    
    // Attach debug info to response
    responseData._debugInfo = debugInfo;
    
    return responseData;
  }
}

