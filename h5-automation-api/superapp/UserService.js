/**
 * User Service for SuperApp SDK
 * Handles user authentication and data retrieval
 */
export class UserService {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://appleseed-uat-portal.joypaydev.com';
    // Bill Payments App Credentials
    this.appId = config.appId || 'AE35182511050000001000105000';
    this.serialNo = config.serialNo || 'p6TTL7DWcA';
    this.appSecretKey = config.appSecretKey || 'MoTtljN1P66E2rZ/sDwj3g==';
  }

  /**
   * Get auth token from URL parameters
   * Expected URL format: https://yourdomain.com/phone?token=your_auth_token_here
   */
  getTokenFromUrl() {
    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    console.log('🔍 Current URL:', currentUrl);
    console.log('🔍 URL Search Params:', window.location.search);
    console.log('🔍 Token from URL:', token ? 'Found' : 'Not found');
    
    if (!token) {
      const expectedUrl = `${window.location.origin}${window.location.pathname}?token=your_auth_token_here`;
      throw new Error(`No token found in URL parameters. Expected URL format: ${expectedUrl}`);
    }
    
    return token;
  }

  /**
   * Get openId using auth token with AES signature
   * @param {string} token - Auth token from URL
   * @returns {Promise<string>} - OpenId
   */
  async getOpenId(token) {
    try {
      const url = `${this.baseUrl}/v1/pay/credential/openid`;
      const body = JSON.stringify({ token });
      
      console.log('🔍 Making request to get openId...');
      console.log('🔍 URL:', url);
      console.log('🔍 Token (first 10 chars):', token.substring(0, 10) + '...');
      console.log('🔍 AppId:', this.appId);
      console.log('🔍 SerialNo:', this.serialNo);
      console.log('🔍 BaseUrl:', this.baseUrl);
      
      // Generate AES signature
      const signatureInfo = await this.generateSignature('POST', url, body);
      console.log('🔍 Generated signature:', signatureInfo);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': signatureInfo.authorization
        },
        body: body
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error response:', errorText);
        console.error('❌ Response status:', response.status);
        console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));
        console.error('❌ Request URL:', url);
        console.error('❌ Request body:', body);
        console.error('❌ Authorization header:', signatureInfo.authorization);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 Response data:', data);
      
      // Check for openId in the actual response structure
      const openId = data.openId;
      
      if (data.code !== 'SUC' || !openId) {
        console.error('❌ Invalid response format:', data);
        console.error('❌ Expected code: "SUC", got:', data.code);
        console.error('❌ Expected openId, got:', data.openId);
        throw new Error(`API Error: ${data.msg || 'Unknown error'} (code: ${data.code})`);
      }

      console.log('✅ OpenId received:', openId);
      return openId;
    } catch (error) {
      console.error('❌ Error getting openId:', error);
      throw new Error(`Failed to get openId: ${error.message}`);
    }
  }

  /**
   * Get user info using authToken and openId with AES signature
   * @param {string} authToken - SuperApp auth token
   * @param {string} openId - User openId
   * @returns {Promise<Object>} - User information
   */
  async getUserInfo(authToken, openId) {
    try {
      const url = `${this.baseUrl}/v1/pay/credential/user/info`;
      const body = JSON.stringify({ openId, authToken });
      
      console.log('🔍 Making request to get user info...');
      console.log('🔍 URL:', url);
      console.log('🔍 AuthToken (first 10 chars):', authToken.substring(0, 10) + '...');
      console.log('🔍 OpenId:', openId);
      console.log('🔍 AppId:', this.appId);
      
      // Generate AES signature
      const signatureInfo = await this.generateSignature('POST', url, body);
      console.log('🔍 Generated signature for user info:', signatureInfo);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': signatureInfo.authorization
        },
        body: body
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 Response data:', data);
      
      if (data.code !== 'SUC' || !data.msisdn) {
        console.error('❌ Invalid response format:', data);
        console.error('❌ Expected code: "SUC", got:', data.code);
        console.error('❌ Expected msisdn, got:', data.msisdn);
        throw new Error(`Failed to get user info: ${data.msg || 'Unknown error'} (code: ${data.code})`);
      }

      console.log('✅ User info received:', data);
      return data;
    } catch (error) {
      console.error('❌ Error getting user info:', error);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  /**
   * Get user phone number from user info
   * @param {Object} userInfo - User information object
   * @returns {string|null} - User phone number or null
   */
  extractPhoneNumber(userInfo) {
    console.log('🔍 Extracting phone number from user info...');
    console.log('🔍 User info structure:', userInfo);
    console.log('🔍 User info keys:', Object.keys(userInfo));
    
    // Try different possible phone number fields
    const phoneFields = ['msisdn', 'phone', 'phoneNumber', 'mobile', 'mobileNumber', 'tel'];
    
    for (const field of phoneFields) {
      console.log(`🔍 Checking field '${field}':`, userInfo[field]);
      if (userInfo[field]) {
        console.log(`✅ Found phone number in field '${field}':`, userInfo[field]);
        return userInfo[field];
      }
    }

    // If no direct phone field, check nested objects
    console.log('🔍 Checking nested objects...');
    if (userInfo.profile?.phone) {
      console.log('✅ Found phone number in profile.phone:', userInfo.profile.phone);
      return userInfo.profile.phone;
    }

    if (userInfo.contact?.phone) {
      console.log('✅ Found phone number in contact.phone:', userInfo.contact.phone);
      return userInfo.contact.phone;
    }

    console.log('❌ No phone number found in any expected fields');
    console.log('🔍 Available nested objects:', {
      profile: userInfo.profile,
      contact: userInfo.contact,
      user: userInfo.user,
      data: userInfo.data
    });
    
    return null;
  }

  /**
   * Generate AES-GCM signature for API requests
   * @param {string} method - HTTP method (GET, POST)
   * @param {string} url - Request URL
   * @param {string} body - Request body (JSON string)
   * @returns {Promise<Object>} - Signature info with authorization header
   */
  async generateSignature(method, url, body = '') {
    const nonceStr = this.generateNonce();
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Build canonical URL (remove domain)
    const urlObj = new URL(url);
    const canonicalUrl = urlObj.pathname + (urlObj.search || '');
    
    // Build signature message according to documentation
    const message = `${method}\n${canonicalUrl}\n${timestamp}\n${nonceStr}\n${body}\n`;
    
    // Generate AES-GCM signature
    const signature = await this.sign(message, this.appSecretKey);
    
    return {
      authorization: `AES appid="${this.appId}",serial_no="${this.serialNo}",nonce_str="${nonceStr}",timestamp="${timestamp}",signature="${signature}"`,
      nonceStr,
      timestamp,
      signature
    };
  }

  /**
   * Generate random nonce string
   * @returns {string} - Random nonce string
   */
  generateNonce() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Sign content using AES-GCM encryption
   * @param {string} content - Content to sign
   * @param {string} keyStr - Base64 encoded secret key
   * @returns {Promise<string>} - Base64 encoded signature
   */
  async sign(content, keyStr) {
    try {
      // Convert base64 key to bytes
      const keyBytes = this.base64ToBytes(keyStr);
      
      // Generate random IV (12 bytes for GCM)
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Import key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      // Encrypt content
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        new TextEncoder().encode(content)
      );
      
      // Combine IV + encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      // Return base64 encoded result
      return this.bytesToBase64(combined);
    } catch (error) {
      console.error('AES signing failed:', error);
      throw new Error('Failed to generate signature');
    }
  }

  /**
   * Convert base64 string to bytes
   * @param {string} base64 - Base64 string
   * @returns {Uint8Array} - Byte array
   */
  base64ToBytes(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Convert bytes to base64 string
   * @param {Uint8Array} bytes - Byte array
   * @returns {string} - Base64 string
   */
  bytesToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Get auth token from SuperApp SDK
   * @returns {Promise<string>} - Auth token
   */
  async getAuthToken() {
    const getAuthTokenRequest = {
      /// H5 application's appId
      appId: this.appId
    };

    return window.payment
      .getAuthToken(getAuthTokenRequest)
      .then(res => {
        /// success callback
        console.log('success', res);
        var authToken = res['authToken']; /// one-time use authorization token.
        return authToken;
      })
      .catch(error => {
        /// failure callback
        console.error('fail', error);
        throw error;
      });
  }

  /**
   * Complete flow: Get openId and user info using dynamic values
   * @param {string} token - URL token
   * @param {string} authToken - SuperApp auth token
   * @returns {Promise<Object>} - Complete user data with openId and user info
   */
  async getOpenIdAndUserInfo(token, authToken) {
    try {
      console.log('🚀 Starting complete flow: openId + user info...');
      
      // Step 1: Get openId using token
      console.log('📍 Step 1: Getting openId...');
      const openId = await this.getOpenId(token);
      console.log('✅ Step 1: Got openId:', openId);

      // Step 2: Get user info using authToken and openId
      console.log('📍 Step 2: Getting user info...');
      const userInfo = await this.getUserInfo(authToken, openId);
      console.log('✅ Step 2: Got user info:', userInfo);

      // Step 3: Extract phone number
      console.log('📍 Step 3: Extracting phone number...');
      const phoneNumber = this.extractPhoneNumber(userInfo);
      console.log('✅ Step 3: Extracted phone number:', phoneNumber);

      const result = {
        token,
        openId,
        authToken,
        userInfo,
        phoneNumber
      };
      
      console.log('🎉 Complete flow successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Complete flow failed:', error);
      throw error;
    }
  }
}

