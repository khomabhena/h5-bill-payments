import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import { colors } from '../data/colors';
import BillPaymentFlowManager from '../../h5-automation-api/superapp/BillPaymentFlowManager';
import { useUserAuth } from '../hooks/useUserAuth';
import PageWrapper from '../components/PageWrapper';

// Local currency formatter (code + rounded amount)
const formatCurrencyDisplay = (amount, currency = 'USD') => {
  const currencyCode = (currency || 'USD').toUpperCase();
  const amountValue = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const roundedAmount = Math.round(amountValue);
  return `${currencyCode} ${roundedAmount}`;
};

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { country, service, provider, product, accountValue, amount, validationData } = location.state || {};

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [statusCard, setStatusCard] = useState(null);
  const { getCompleteUserData, userData, getAuthToken } = useUserAuth();

  // Hide SuperApp header
  useEffect(() => {
    if (window.payment && typeof window.payment.setHeader === 'function') {
      try {
        window.payment.setHeader({ hasTitleBar: false });
      } catch (e) {
        console.error('Error setting SuperApp header:', e);
      }
    }
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
    setStatusCard({
      title: 'Preparing Payment',
      message: 'Setting up your order, please wait…',
      tone: 'info'
    });
    
    try {
      // Initialize BillPaymentFlowManager with logging callback
      const flowManager = new BillPaymentFlowManager((type, message) => {
        if (type === 'error') {
          setStatusCard({
            title: 'Payment Issue',
            message: message.replace(/^[^:]+:\s*/, ''),
            tone: 'error'
          });
          return;
        }

        if (message.includes('Step 1')) {
          setStatusCard({
            title: 'Preparing Payment',
            message: 'Setting up your order, please wait…',
            tone: 'info'
          });
        } else if (message.includes('Step 2')) {
          setStatusCard({
            title: 'Awaiting Confirmation',
            message: 'Complete the payment in the SuperApp cashier.',
            tone: 'info'
          });
        } else if (message.includes('Step 3')) {
          setStatusCard({
            title: 'Confirming Payment',
            message: 'Checking the status of your payment…',
            tone: 'info'
          });
        } else if (message.includes('Step 4')) {
          setStatusCard({
            title: 'Fetching Voucher/Bundle',
            message: 'Please wait while we retrieve your voucher details…',
            tone: 'fetching'
          });
        } else if (message.includes('AppleTree postPayment completed successfully')) {
          setStatusCard({
            title: 'Voucher Ready',
            message: 'We have successfully retrieved your voucher.',
            tone: 'success'
          });
        }
      });

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
      // Using the recommended approach from SUPERAPP_USERINFO_AND_CASHIER_GUIDE.md
      let userInfo = null;
      try {
        
        // Use getCompleteUserData from useUserAuth hook (recommended method)
        const userDataResult = await getCompleteUserData();
        
        if (userDataResult?.userInfo) {
          
          // Format userInfo for PostPayment API (if needed)
          userInfo = {
            CustomerId: userDataResult.openId || userDataResult.userInfo?.userId || userDataResult.userInfo?.id || '1L',
            Fullname: userDataResult.userInfo?.name || userDataResult.userInfo?.fullName || userDataResult.userInfo?.displayName || '1L',
            MobileNumber: userDataResult.phoneNumber || userDataResult.userInfo?.msisdn || userDataResult.userInfo?.phoneNumber || userDataResult.userInfo?.phone || '+263777077921',
            EmailAddress: userDataResult.userInfo?.email || userDataResult.userInfo?.emailAddress || null,
            authToken: userDataResult.authToken,
            openId: userDataResult.openId,
            // Include full userInfo for reference
            userInfo: userDataResult.userInfo
          };
        }
      } catch (userInfoError) {
        // User info is optional - continue with defaults
      }
      
      
      // Execute payment flow (PostPayment disabled for now as requested)
      const postToAppleTree = true;
      
      const paymentResult = await flowManager.executePayment(paymentData, {
        postToAppleTree,
        userInfo: userInfo
      });
 
      if (paymentResult.paymentStatus === 'SUCCESS' && paymentResult.appleTreeResult?.Status === 'SUCCESSFUL') {
        setStatusCard({
          title: 'Voucher Ready',
          message: 'We have successfully retrieved your voucher.',
          tone: 'success'
        });
      } else if (paymentResult.appleTreeResult?.Status === 'FAILEDREPEATABLE') {
        setStatusCard({
          title: 'Fulfillment Pending',
          message: paymentResult.appleTreeResult.ResultMessage || 'Request processing timed out.',
          tone: 'warning'
        });
      } else if (paymentResult.appleTreeResult?.Status === 'FAILED') {
        setStatusCard({
          title: 'Fulfillment Failed',
          message: paymentResult.appleTreeResult.ResultMessage || 'Failed to process your request. Please retry later.',
          tone: 'error'
        });
      }

      if (!paymentResult.appleTreeResult) {
        setStatusCard({
          title: 'Voucher Pending',
          message: 'Waiting for fulfillment response…',
          tone: 'warning'
        });
      }

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
          
          // AppleTree result
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
          setStatusCard({
            title: 'Payment Timeout',
            message: 'The payment took too long. Please try again.',
            tone: 'error'
          });
        } else if (error.message.includes('window.payment')) {
          errorMessage = 'Payment system is not available. Please ensure you are using the SuperApp.';
          setStatusCard({
            title: 'Payment Unavailable',
            message: 'The SuperApp payment system is not available right now.',
            tone: 'error'
          });
        } else if (error.message.includes('cancelled') || error.message.includes('cancel')) {
          errorMessage = 'Payment was cancelled.';
          setStatusCard({
            title: 'Payment Cancelled',
            message: 'You cancelled the payment. Please try again if this was unintentional.',
            tone: 'warning'
          });
        } else if (error.message.includes('denied') || error.message.includes('permission')) {
          errorMessage = 'Payment was denied. Please check your payment settings.';
          setStatusCard({
            title: 'Payment Denied',
            message: 'The payment was denied. Please check your payment settings.',
            tone: 'error'
          });
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

  const getStatusCardStyle = () => {
    if (!statusCard) return {};
    switch (statusCard.tone) {
      case 'fetching':
        return {
          backgroundColor: colors.app.primaryDark,
          color: '#ffffff'
        };
      case 'success':
        return {
          backgroundColor: colors.app.primaryLight,
          color: colors.text.primary
        };
      case 'warning':
        return {
          backgroundColor: '#FEF3C7',
          color: '#92400E'
        };
      case 'error':
        return {
          backgroundColor: colors.state.errorLight,
          color: colors.state.error
        };
      default:
        return {
          backgroundColor: colors.background.secondary,
          color: colors.text.primary
        };
    }
  };

  const shouldShowSpinner = statusCard && ['fetching', 'info'].includes(statusCard.tone);

  const renderStatusIcon = () => {
    if (!statusCard) return null;
    if (shouldShowSpinner) {
      return (
        <span className="mt-1 inline-flex h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
      );
    }
    if (statusCard.tone === 'success') {
      return (
        <span className="mt-1 inline-flex h-5 w-5 shrink-0">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      );
    }
    if (statusCard.tone === 'warning') {
      return (
        <span className="mt-1 inline-flex h-5 w-5 shrink-0">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      );
    }
    if (statusCard.tone === 'error') {
      return (
        <span className="mt-1 inline-flex h-5 w-5 shrink-0">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      );
    }
    return (
      <span className="mt-1 inline-flex h-5 w-5 shrink-0">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6" />
        </svg>
      </span>
    );
  };

  return (
    <PageWrapper>
      {/* Header */}
      <Header title="Complete Payment" showBackButton={true} />
      
      {/* Main Content - White Background */}
      <div className="bg-white w-full flex-1 flex flex-col mt-4 rounded-3xl">
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
                <span className="font-medium">{formatCurrencyDisplay(amount, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Country</span>
                <span className="font-medium">{country?.countryName || 'N/A'}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-base font-bold">
                <span>Total Price:</span>
                <span style={{color: colors.app.primaryDark}}>{formatCurrencyDisplay(amount, currency)}</span>
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

          {/* Status Card */}
          {statusCard && (
            <div className="mt-4 rounded-2xl p-4 shadow-sm" style={getStatusCardStyle()}>
              <div className="flex items-start space-x-3">
                {renderStatusIcon()}
                <div className="flex-1">
                  <p className="font-semibold text-sm">{statusCard.title}</p>
                  {statusCard.message && (
                    <p className="text-xs mt-1 opacity-80">{statusCard.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pay Button - Fixed at Bottom */}
        <div className="px-6 pb-10">
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            loading={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : `Pay ${formatCurrencyDisplay(amount, currency)}`}
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Payment;

