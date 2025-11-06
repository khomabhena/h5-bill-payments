import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import { colors } from '../data/colors';
import BillPaymentFlowManager from '../../h5-automation-api/superapp/BillPaymentFlowManager';
import { useUserAuth } from '../hooks/useUserAuth';

// Format currency as "USD 10" or "ZAR 23" (currency code first, no decimals)
const formatCurrencyCode = (amount, currency = 'USD') => {
  const currencyCode = (currency || 'USD').toUpperCase();
  const amountValue = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  // Round to whole number and format
  const roundedAmount = Math.round(amountValue);
  return `${currencyCode} ${roundedAmount}`;
};

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { country, service, provider, product, accountValue, amount, validationData } = location.state || {};

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const { userData, getAuthToken } = useUserAuth();

  // Hide SuperApp header
  useEffect(() => {
    if (window.payment && typeof window.payment.setHeader === 'function') {
      try {
        window.payment.setHeader({ visible: false });
      } catch (error) {
        // Silently fail if setHeader is not available or fails
      }
    }
    
    // Cleanup: Show header again when component unmounts
    return () => {
      if (window.payment && typeof window.payment.setHeader === 'function') {
        try {
          window.payment.setHeader({ visible: true });
        } catch (error) {
          // Silently fail if setHeader is not available or fails
        }
      }
    };
  }, []);

  // Redirect if no required data
  useEffect(() => {
    if (!product || !country || !service || !provider || !accountValue || !amount) {
      navigate('/account', { replace: true });
    }
  }, [product, country, service, provider, accountValue, amount, navigate]);

  // Get account name from validation data
  const getAccountName = () => {
    if (validationData?.DisplayData) {
      const accountNameItem = validationData.DisplayData.find(item => 
        item.Label?.toLowerCase().includes('account name') || 
        item.Label?.toLowerCase().includes('name')
      );
      return accountNameItem?.Value || accountValue;
    }
    return accountValue;
  };

  const handlePayment = async () => {
    // Prevent duplicate payment requests
    if (isProcessing) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Initialize BillPaymentFlowManager
      const flowManager = new BillPaymentFlowManager();

      // Prepare payment data
      const paymentData = {
        country,
        service,
        provider,
        product,
        accountValue,
        amount,
        validationData
      };

      // Get user info if available (optional - will use defaults if not available)
      let userInfo = null;
      try {
        // Try to get auth token and user data if available
        if (window.payment && typeof window.payment.getAuthToken === 'function') {
          const authToken = await getAuthToken();
          // If we have userData from useUserAuth, use it
          if (userData) {
            userInfo = {
              CustomerId: userData.openId || userData.CustomerId || '1L',
              Fullname: userData.userInfo?.msisdn || userData.Fullname || '1L',
              MobileNumber: userData.phoneNumber || userData.userInfo?.msisdn || userData.MobileNumber || '+263777077921',
              EmailAddress: userData.EmailAddress || null,
              authToken: authToken,
              openId: userData.openId
            };
          }
        }
      } catch (userInfoError) {
        // User info is optional - continue with defaults
      }

      // Execute payment flow (PostPayment disabled for now as requested)
      const paymentResult = await flowManager.executePayment(paymentData, {
        postToAppleTree: false, // Skip PostPayment for now - will implement later
        userInfo: userInfo
      });

      // Navigate to confirmation with payment result
      navigate('/confirmation', {
        state: {
          // Payment result data
          success: paymentResult.success,
          transactionId: paymentResult.transactionId,
          prepayId: paymentResult.prepayId,
          paymentStatus: paymentResult.paymentStatus,
          timestamp: paymentResult.timestamp,
          
          // Original payment data
          country,
          service,
          provider,
          product,
          accountValue,
          amount,
          validationData,
          
          // Payment flow results
          cashierResult: paymentResult.cashierResult,
          statusResult: paymentResult.statusResult,
          
          // AppleTree result (null for now since postToAppleTree is false)
          appleTreeResult: paymentResult.appleTreeResult
        }
      });
    } catch (error) {
      // Extract user-friendly error message
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
        
        // Provide more specific error messages
        if (error.message.includes('timeout')) {
          errorMessage = 'Payment request timed out. Please try again.';
        } else if (error.message.includes('window.payment')) {
          errorMessage = 'Payment system is not available. Please ensure you are using the SuperApp.';
        } else if (error.message.includes('cancelled') || error.message.includes('cancel')) {
          errorMessage = 'Payment was cancelled.';
        } else if (error.message.includes('denied') || error.message.includes('permission')) {
          errorMessage = 'Payment was denied. Please check your payment settings.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!product || !country || !service || !provider || !accountValue || !amount) {
    return null; // Will redirect
  }

  const currency = product?.Currency || 'USD';
  const accountName = getAccountName();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <Header title="Complete Payment" showBackButton={true} />
      
      {/* Main Content - White Background */}
      <div className="bg-white w-full flex-1 flex flex-col">
        <div className="px-6 pb-6 flex-1">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 mb-6 mt-4">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Order Summary</h3>
            <div className="space-y-2 text-gray-950">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Provider</span>
                <span className="font-medium">{provider?.Name || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Product</span>
                <span className="font-medium">{product?.Name || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Account Number</span>
                <span className="font-medium">{accountValue || 'N/A'}</span>
              </div>
              {accountName && accountName !== accountValue && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Account Name</span>
                  <span className="font-medium">{accountName}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium">{formatCurrencyCode(amount, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Country</span>
                <span className="font-medium">{country?.countryName || 'N/A'}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-base font-bold">
                <span>Total Price:</span>
                <span style={{color: colors.app.primaryDark}}>{formatCurrencyCode(amount, currency)}</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium text-red-800 text-sm">Payment Error</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="rounded-lg p-3 border" style={{backgroundColor: colors.background.secondary, borderColor: colors.border.primary}}>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" style={{color: colors.app.primaryDark}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="font-medium text-sm" style={{color: colors.text.primary}}>Secure Payment</p>
                <p className="text-xs" style={{color: colors.text.secondary}}>Your payment is encrypted and secure</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pay Button - Fixed at Bottom */}
        <div className="p-6 pb-24">
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            loading={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : `Pay ${formatCurrencyCode(amount, currency)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Payment;

