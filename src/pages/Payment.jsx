import React, { useState, useEffect, useCallback } from 'react';
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
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebugLogs, setShowDebugLogs] = useState(true);
  const { userData, getAuthToken } = useUserAuth();

  // Debug logging function that adds logs to state (visible in SuperApp UI)
  const addDebugLog = useCallback((type, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp,
      type, // 'info', 'error', 'success', 'warning', 'data'
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    
    setDebugLogs(prev => {
      const newLogs = [...prev, logEntry];
      // Keep only last 100 logs to prevent memory issues
      return newLogs.slice(-100);
    });
  }, []);

  // Hide SuperApp header and log bridge availability
  useEffect(() => {
    addDebugLog('info', '🔍 Checking SuperApp bridge availability...');
    
    if (window.payment) {
      addDebugLog('success', '✅ window.payment is available');
      addDebugLog('data', '📋 Available methods', Object.keys(window.payment));
      
      if (typeof window.payment.setHeader === 'function') {
        try {
          window.payment.setHeader({ visible: false });
          addDebugLog('success', '✅ SuperApp header hidden');
        } catch (error) {
          addDebugLog('error', '❌ Failed to hide header', {
            message: error?.message,
            name: error?.name
          });
        }
      } else {
        addDebugLog('warning', '⚠️ window.payment.setHeader is not available');
      }
    } else {
      addDebugLog('error', '❌ window.payment is not available - not running in SuperApp');
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
  }, [addDebugLog]);

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
    setDebugLogs([]); // Clear previous logs
    addDebugLog('info', '🚀 Payment process started');
    
    try {
      // Initialize BillPaymentFlowManager with debug logging callback
      const flowManager = new BillPaymentFlowManager((type, message, data) => {
        addDebugLog(type, message, data);
      });
      
      addDebugLog('info', '✅ BillPaymentFlowManager initialized');

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
        addDebugLog('info', '🔍 Attempting to get user info...');
        // Try to get auth token and user data if available
        if (window.payment && typeof window.payment.getAuthToken === 'function') {
          addDebugLog('info', '✅ window.payment.getAuthToken is available');
          const authToken = await getAuthToken();
          addDebugLog('success', '✅ Auth token retrieved');
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
            addDebugLog('data', '👤 User info prepared', userInfo);
          } else {
            addDebugLog('warning', '⚠️ No userData available, using defaults');
          }
        } else {
          addDebugLog('warning', '⚠️ window.payment.getAuthToken not available');
        }
      } catch (userInfoError) {
        addDebugLog('error', '❌ Failed to get user info', {
          message: userInfoError?.message,
          name: userInfoError?.name,
          stack: userInfoError?.stack
        });
        // User info is optional - continue with defaults
      }
      
      addDebugLog('info', '💳 Preparing payment data...', paymentData);

      // Execute payment flow (PostPayment disabled for now as requested)
      addDebugLog('info', '🏪 Starting payment execution (cashier pull)...');
      addDebugLog('info', '📋 Payment options', {
        postToAppleTree: false,
        hasUserInfo: !!userInfo
      });
      
      const paymentResult = await flowManager.executePayment(paymentData, {
        postToAppleTree: false, // Skip PostPayment for now - will implement later
        userInfo: userInfo
      });
      
      addDebugLog('success', '✅ Payment execution completed', {
        success: paymentResult.success,
        transactionId: paymentResult.transactionId,
        paymentStatus: paymentResult.paymentStatus
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
      // Log full error details for debugging
      addDebugLog('error', '❌ Payment Error Caught', {
        message: error?.message || 'Unknown error',
        name: error?.name || 'Error',
        stack: error?.stack || 'No stack trace',
        fullError: error?.toString(),
        errorObject: error
      });
      
      // Check for SuperApp specific errors
      if (error?.code) {
        addDebugLog('error', '🔴 SuperApp Error Code', { code: error.code, msg: error.msg });
      }
      
      // Extract user-friendly error message
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
        
        // Provide more specific error messages
        if (error.message.includes('timeout')) {
          errorMessage = 'Payment request timed out. Please try again.';
          addDebugLog('error', '⏱️ Timeout error detected');
        } else if (error.message.includes('window.payment')) {
          errorMessage = 'Payment system is not available. Please ensure you are using the SuperApp.';
          addDebugLog('error', '🔴 SuperApp payment API not available');
        } else if (error.message.includes('cancelled') || error.message.includes('cancel')) {
          errorMessage = 'Payment was cancelled.';
          addDebugLog('warning', '⚠️ Payment was cancelled by user');
        } else if (error.message.includes('denied') || error.message.includes('permission')) {
          errorMessage = 'Payment was denied. Please check your payment settings.';
          addDebugLog('error', '🔴 Payment permission denied');
        } else if (error.message.includes('cashier')) {
          addDebugLog('error', '🔴 Cashier error detected', {
            message: error.message,
            source: 'CASHIER'
          });
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      addDebugLog('info', '🏁 Payment process completed');
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

          {/* Debug Logs Display */}
          {showDebugLogs && (
            <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-sm">
                  Debug Logs {debugLogs.length > 0 && `(${debugLogs.length})`}
                </h3>
                <div className="flex items-center space-x-2">
                  {debugLogs.length > 0 && (
                    <button
                      onClick={() => setDebugLogs([])}
                      className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-gray-800"
                      title="Clear logs"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setShowDebugLogs(!showDebugLogs)}
                    className="text-gray-400 hover:text-white text-xs"
                  >
                    Hide
                  </button>
                </div>
              </div>
              {debugLogs.length === 0 ? (
                <p className="text-gray-500 text-xs">No logs yet. Start a payment to see debug information.</p>
              ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {debugLogs.map((log) => {
                  let bgColor = 'bg-gray-800';
                  let textColor = 'text-gray-300';
                  let icon = 'ℹ️';
                  
                  if (log.type === 'error') {
                    bgColor = 'bg-red-900';
                    textColor = 'text-red-200';
                    icon = '❌';
                  } else if (log.type === 'success') {
                    bgColor = 'bg-green-900';
                    textColor = 'text-green-200';
                    icon = '✅';
                  } else if (log.type === 'warning') {
                    bgColor = 'bg-yellow-900';
                    textColor = 'text-yellow-200';
                    icon = '⚠️';
                  } else if (log.type === 'data') {
                    bgColor = 'bg-blue-900';
                    textColor = 'text-blue-200';
                    icon = '📋';
                  }
                  
                  return (
                    <div key={log.id} className={`${bgColor} ${textColor} rounded p-2 text-xs font-mono`}>
                      <div className="flex items-start space-x-2">
                        <span className="text-xs">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400 text-[10px]">{log.timestamp}</span>
                            <span className="text-gray-500">|</span>
                            <span className="uppercase text-[10px] font-bold">{log.type}</span>
                          </div>
                          <p className="mt-1 break-words">{log.message}</p>
                          {log.data && (
                            <pre className="mt-2 text-[10px] bg-black bg-opacity-30 p-2 rounded overflow-x-auto">
                              {log.data}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}
          
          {/* Show Debug Logs Button (when hidden) */}
          {!showDebugLogs && (
            <button
              onClick={() => setShowDebugLogs(true)}
              className="w-full bg-gray-800 text-white text-xs py-2 rounded mb-4 hover:bg-gray-700"
            >
              Show Debug Logs {debugLogs.length > 0 && `(${debugLogs.length})`}
            </button>
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

