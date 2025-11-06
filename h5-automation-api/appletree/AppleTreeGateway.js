/**
 * AppleTree Gateway API Client
 * Handles all API requests to AppleTree Gateway with proper headers and error handling
 * 
 * import AppleTreeGateway from './AppleTreeGateway';
 * 
 * const gateway = new AppleTreeGateway({ merchantId: 'your-id' });
 * const products = await gateway.getProducts({ countryCode: 'ZW', serviceId: 1 });
 */

export default class AppleTreeGateway {
  constructor(config = {}) {
    // Default credentials (can be overridden)
    this.merchantId = config.merchantId || '23de4621-ea24-433f-9b45-dc1e383d8c2b';
    this.baseUrl = config.baseUrl || 'https://sandbox-dev.appletreepayments.com';
    this.apiVersion = config.apiVersion || 'V2';
  }

  async request(method, endpoint, data = null) {
    const url = `${this.baseUrl}/vas/${this.apiVersion}/${endpoint}`;
    
    const headers = {
      'MerchantId': this.merchantId
    };

    // Only add Content-Type for non-GET requests with data
    if (data && method.toUpperCase() !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    const options = {
      method: method.toUpperCase(),
      headers: headers
    };

    if (data && method.toUpperCase() !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseText = await response.text();
    
    console.log('🌳 Raw API Response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      responseText: responseText.substring(0, 500) // First 500 chars
    });
    
    if (!response.ok) {
      let errorJson;
      try {
        errorJson = JSON.parse(responseText);
      } catch (e) {
        const error = new Error(`HTTP ${response.status}: ${responseText.substring(0, 200)}`);
        // Attach debug info to error
        error.debugInfo = {
          url,
          method: method.toUpperCase(),
          headers: options.headers,
          payload: data,
          responseStatus: response.status,
          responseStatusText: response.statusText,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          responseBody: responseText,
          timestamp: new Date().toISOString()
        };
        throw error;
      }
      const error = new Error(errorJson.ResultMessage || errorJson.message || `HTTP ${response.status}`);
      // Attach debug info to error
      error.debugInfo = {
        url,
        method: method.toUpperCase(),
        headers: options.headers,
        payload: data,
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        responseBody: errorJson,
        timestamp: new Date().toISOString()
      };
      // Also attach the full error JSON for detailed logging
      error.responseBody = errorJson;
      throw error;
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('🌳 Failed to parse response as JSON:', responseText);
      throw new Error(`Invalid JSON response: ${e.message}`);
    }
    
    console.log('🌳 Parsed API Response:', {
      status: result.Status,
      hasData: !!result.Data,
      responseKeys: Object.keys(result),
      resultMessage: result.ResultMessage
    });
    
    if (result.Status === 'ERROR' || result.Status === 'NOTFOUND') {
      const error = new Error(result.ResultMessage || result.message || 'API request failed');
      // Attach debug info to error
      error.debugInfo = {
        url,
        method: method.toUpperCase(),
        headers: options.headers,
        payload: data,
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        responseBody: result,
        timestamp: new Date().toISOString()
      };
      error.responseBody = result;
      throw error;
    }

    return result;
  }

  async getCountries() {
    const response = await this.request('GET', 'Countries');
    return response;
  }

  async getServices(countryCode = null) {
    const endpoint = countryCode ? `Services?CountryCode=${countryCode}` : 'Services';
    const response = await this.request('GET', endpoint);
    return response;
  }

  async getServiceProviders(filters = {}) {
    const params = new URLSearchParams();
    // Use lowercase parameter names to match Products endpoint format
    if (filters.countryCode) params.append('countryCode', filters.countryCode);
    if (filters.serviceId) params.append('service', filters.serviceId);
    
    const endpoint = params.toString() ? `ServiceProviders?${params}` : 'ServiceProviders';
    const response = await this.request('GET', endpoint);
    return response;
  }

  async getProducts(filters) {
    if (!filters.countryCode || !filters.serviceId) {
      throw new Error('countryCode and serviceId are required');
    }

    const params = new URLSearchParams({
      countryCode: filters.countryCode,
      service: filters.serviceId
    });

    if (filters.serviceProviderId) {
      params.append('serviceProviderId', filters.serviceProviderId);
    }

    const endpoint = `Products?${params}`;
    const response = await this.request('GET', endpoint);
    return response;
  }

  async getProductById(productId) {
    if (!productId) throw new Error('productId is required');
    const response = await this.request('GET', `Product?id=${productId}`);
    return response;
  }

  async validatePayment(paymentData) {
    this.validatePaymentData(paymentData);
    return await this.request('POST', 'ValidatePayment', paymentData);
  }

  async postPayment(paymentData) {
    this.validatePaymentData(paymentData);
    return await this.request('POST', 'PostPayment', paymentData);
  }

  async getPaymentStatus(requestId) {
    if (!requestId) throw new Error('requestId is required');
    return await this.request('GET', `GetPaymentStatus?requestId=${requestId}`);
  }

  async reversePayment(requestId) {
    if (!requestId) throw new Error('requestId is required');
    return await this.request('GET', `ReversePayment?requestId=${requestId}`);
  }

  validatePaymentData(paymentData) {
    const required = ['RequestId', 'ProductId', 'Currency', 'CustomerDetails', 'CreditPartyIdentifiers', 'POSDetails'];
    
    for (const field of required) {
      if (!paymentData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    if (paymentData.Amount === undefined || paymentData.Amount === null) {
      throw new Error('Amount is required');
    }
    
    // Validate CustomerDetails structure
    if (!paymentData.CustomerDetails.CustomerId) {
      throw new Error('CustomerDetails.CustomerId is required');
    }
    if (!paymentData.CustomerDetails.Fullname) {
      throw new Error('CustomerDetails.Fullname is required');
    }
    if (!paymentData.CustomerDetails.MobileNumber) {
      throw new Error('CustomerDetails.MobileNumber is required');
    }
    
    // Validate CreditPartyIdentifiers is an array
    if (!Array.isArray(paymentData.CreditPartyIdentifiers) || paymentData.CreditPartyIdentifiers.length === 0) {
      throw new Error('CreditPartyIdentifiers must be a non-empty array');
    }
    
    // Validate POSDetails structure
    if (!paymentData.POSDetails.StoreId || !paymentData.POSDetails.TerminalId || !paymentData.POSDetails.CashierId) {
      throw new Error('POSDetails must have StoreId, TerminalId, and CashierId');
    }
  }

  static generateRequestId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Service ID constants
export const Services = {
  MOBILE_AIRTIME: 1,
  MOBILE_DATA: 2,
  MOBILE_BUNDLES: 3,
  INTERNET_BROADBAND: 5,
  ELECTRICITY: 6,
  GAS: 8,
  EDUCATION: 9,
  INSURANCE: 10,
  PHONE: 12,
  TELEVISION: 13,
  LOCAL_AUTHORITIES: 17,
  RETAIL_SHOPS: 18
};

