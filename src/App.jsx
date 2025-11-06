import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CountryServiceSelection from './pages/CountryServiceSelection';
import ProviderSelection from './pages/ProviderSelection';
import ProductSelection from './pages/ProductSelection';
import AccountInput from './pages/AccountInput';
import Payment from './pages/Payment';
import Confirmation from './pages/Confirmation';

function App() {
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

