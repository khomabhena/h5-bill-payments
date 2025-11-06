/**
 * Mock SuperApp Bridge for Browser Testing
 * This simulates the SuperApp environment in a regular browser
 * DO NOT USE IN PRODUCTION - Only for development/testing
 */

(function() {
  // Only inject if not already present (don't override real SuperApp)
  if (window.AppNativeJsBridge) {
    console.log('🔵 Real AppNativeJsBridge already exists - using native');
    return;
  }

  console.log('🧪 MOCK MODE: Injecting mock AppNativeJsBridge for browser testing');
  console.warn('⚠️ This is a MOCK bridge - not real SuperApp!');

  // Create mock bridge
  window.AppNativeJsBridge = {
    postMessage: function(message) {
      console.log('📤 Mock Bridge Received:', message);
      
      try {
        const data = JSON.parse(message);
        console.log('  API:', data.api);
        console.log('  Data:', data.data);
        console.log('  Callback:', data.callback);
        
        // Simulate async response after short delay
        setTimeout(() => {
          const callback = window.AppNativeJsBridgeCallback?.callback[data.callback];
          
          if (callback) {
            let response;
            
            // Mock different API responses
            switch (data.api) {
              case 'getAuthToken':
                response = {
                  code: '0',
                  data: {
                    authToken: 'mock_token_' + Date.now(),
                    expiresIn: 3600
                  }
                };
                break;
                
              case 'payOrder':
                console.log('💳 Mock Payment Order:', data.data);
                response = {
                  code: '0',
                  data: {
                    success: true,
                    transactionId: 'mock_txn_' + Date.now(),
                    status: 'SUCCESS',
                    message: 'Mock payment successful'
                  }
                };
                break;
                
              case 'getDeviceInfo':
                response = {
                  code: '0',
                  data: {
                    platform: 'Mock',
                    version: '1.0.0',
                    deviceId: 'mock_device_123'
                  }
                };
                break;
                
              default:
                response = {
                  code: '0',
                  data: {
                    success: true,
                    message: 'Mock response for ' + data.api
                  }
                };
            }
            
            console.log('📥 Mock Bridge Responding:', response);
            callback(JSON.stringify(response));
          } else {
            console.error('❌ Callback not found:', data.callback);
          }
        }, 500); // Simulate 500ms delay
        
      } catch (error) {
        console.error('❌ Mock bridge error:', error);
      }
    }
  };

  // Update user agent to include "Customer" for SDK environment check
  const originalUserAgent = navigator.userAgent;
  Object.defineProperty(navigator, 'userAgent', {
    get: function() {
      return originalUserAgent + ' Customer';
    },
    configurable: true
  });

  console.log('✅ Mock bridge injected');
  console.log('✅ User agent updated to include "Customer"');
  console.log('🧪 You can now test payment flows in the browser');
  console.log('⚠️ Remember: This is MOCK data, not real payments!');
})();

