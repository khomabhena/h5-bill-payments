import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CountryServiceSelection from './pages/CountryServiceSelection';
import ProviderSelection from './pages/ProviderSelection';
import ProductSelection from './pages/ProductSelection';
import AccountInput from './pages/AccountInput';
import Payment from './pages/Payment';
import Confirmation from './pages/Confirmation';

function App() {
  const [headerDebugLog, setHeaderDebugLog] = useState([]);

  // Hide SuperApp header for the entire app (user will use their own navigation)
  // Using the same approach as the airtime app: hasTitleBar: false
  useEffect(() => {
    setHeaderDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: '🔄 Attempting to hide SuperApp header...' }]);
    
    // Add a small delay to ensure SDK is loaded
    const timer = setTimeout(() => {
      const setHeaderRequest = {
        hasTitleBar: false
      };

      if (window.payment && typeof window.payment.setHeader === 'function') {
        setHeaderDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: '✅ window.payment.setHeader is available' }]);
        setHeaderDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: '📋 Request payload', data: setHeaderRequest }]);
        
        window.payment
          .setHeader(setHeaderRequest)
          .then(res => {
            setHeaderDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: '✅ Header hidden successfully', data: res }]);
            console.log('✅ Header hidden successfully', res);
          })
          .catch(error => {
            // Detailed error logging
            const errorDetails = {
              message: error?.message || error?.msg || 'Unknown error',
              code: error?.code || 'NO_CODE',
              name: error?.name || 'Error',
              fullError: JSON.stringify(error),
              errorType: error?.constructor?.name || 'Unknown',
              isPermissionError: error?.message?.toLowerCase()?.includes('permission') || 
                                 error?.message?.toLowerCase()?.includes('denied')
            };
            setHeaderDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: '❌ PERMISSION DENIED or Error', data: errorDetails }]);
            console.error('❌ Failed to hide header', error);
            
            // Try alternative: just check if it's a permission issue
            if (errorDetails.isPermissionError) {
              setHeaderDebugLog(prev => [...prev, { 
                time: new Date().toLocaleTimeString(), 
                msg: '⚠️ This may be a SuperApp configuration issue. The mini app may not have permission to hide the header.' 
              }]);
            }
          });
      } else {
        setHeaderDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: '⚠️ window.payment.setHeader not available - SuperApp SDK may not be loaded' }]);
        console.warn('⚠️ window.payment.setHeader not available - SuperApp SDK may not be loaded');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Debug log for SuperApp token presence (mirrors airtime app behaviour)
  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get('token');

    if (urlToken) {
      const preview = urlToken.length > 8 ? `${urlToken.substring(0, 4)}...${urlToken.substring(urlToken.length - 4)}` : urlToken;

      try {
        sessionStorage.setItem('superapp_token', urlToken);
      } catch (storageError) {
        console.warn('⚠️ Unable to persist SuperApp token to sessionStorage', storageError);
      }

      setHeaderDebugLog(prev => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          msg: '✅ URL token detected',
          data: {
            tokenPreview: preview,
            tokenValue: urlToken,
            length: urlToken.length,
            fullUrl: window.location.href
          }
        }
      ]);
    } else {
      let storedToken = null;
      try {
        storedToken = sessionStorage.getItem('superapp_token');
      } catch (storageError) {
        console.warn('⚠️ Unable to read SuperApp token from sessionStorage', storageError);
      }

      setHeaderDebugLog(prev => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          msg: storedToken ? 'ℹ️ Using stored SuperApp token (URL empty)' : '❌ No token found in URL',
          data: {
            queryString: window.location.search || '(empty)',
            storedTokenPreview: storedToken ? `${storedToken.substring(0, 4)}...${storedToken.substring(storedToken.length - 4)}` : null
          }
        }
      ]);
    }
  }, []);

  return (
    <>
      {/* Debug Log Overlay */}
      {headerDebugLog.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1f2937',
          color: 'white',
          padding: '8px',
          fontSize: '10px',
          fontFamily: 'monospace',
          zIndex: 9999,
          maxHeight: '120px',
          overflowY: 'auto',
          borderBottom: '2px solid #10b981'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '11px' }}>
            SuperApp Header Debug Log
            <button
              onClick={() => setHeaderDebugLog([])}
              style={{
                float: 'right',
                background: '#374151',
                border: 'none',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
          {headerDebugLog.map((log, idx) => (
            <div key={idx} style={{ marginBottom: '2px', paddingLeft: '4px' }}>
              <span style={{ color: '#9ca3af' }}>[{log.time}]</span> {log.msg}
              {log.data && (
                <div style={{ marginLeft: '12px', color: '#60a5fa', fontSize: '9px' }}>
                  {JSON.stringify(log.data)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <Router>
        <Routes>
          <Route path="/" element={<CountryServiceSelection />} />
          <Route path="/providers" element={<ProviderSelection />} />
          <Route path="/products" element={<ProductSelection />} />
          <Route path="/account" element={<AccountInput />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/confirmation" element={<Confirmation />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;

