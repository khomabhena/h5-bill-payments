import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CountryServiceSelection from './pages/CountryServiceSelection';
import ProviderSelection from './pages/ProviderSelection';
import ProductSelection from './pages/ProductSelection';
import AccountInput from './pages/AccountInput';
import Payment from './pages/Payment';
import Confirmation from './pages/Confirmation';

function App() {
  // Hide SuperApp header for the entire app (user will use their own navigation)
  // Using the same approach as the airtime app: hasTitleBar: false
  useEffect(() => {
    if (window.payment && typeof window.payment.setHeader === 'function') {
      const setHeaderRequest = {
        hasTitleBar: false
      };
      
      window.payment
        .setHeader(setHeaderRequest)
        .then(res => {
          console.log('Header set successfully', res);
        })
        .catch(error => {
          console.error('Failed to set header', error);
        });
    }
    // Don't restore header on unmount - keep it hidden for the entire app
  }, []);

  return (
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
  );
}

export default App;

