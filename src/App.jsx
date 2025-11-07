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
        
        window.payment
          .setHeader(setHeaderRequest)
          .then(res => {
            setHeaderDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: '✅ Header hidden successfully', data: res }]);
            console.log('✅ Header hidden successfully', res);
          })
          .catch(error => {
            setHeaderDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: '❌ Failed to hide header', data: error }]);
            console.error('❌ Failed to hide header', error);
          });
      } else {
        setHeaderDebugLog(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: '⚠️ window.payment.setHeader not available - SuperApp SDK may not be loaded' }]);
        console.warn('⚠️ window.payment.setHeader not available - SuperApp SDK may not be loaded');
      }
    }, 100);

    return () => clearTimeout(timer);
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

