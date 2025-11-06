import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import { colors } from '../data/colors';

// Format currency as "USD 10" or "ZAR 23" (currency code first, no decimals)
const formatCurrencyCode = (amount, currency = 'USD') => {
  const currencyCode = (currency || 'USD').toUpperCase();
  const amountValue = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const roundedAmount = Math.round(amountValue);
  return `${currencyCode} ${roundedAmount}`;
};

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    success, 
    transactionId, 
    prepayId,
    paymentStatus,
    country, 
    service, 
    provider, 
    product, 
    accountValue, 
    amount, 
    validationData,
    appleTreeResult
  } = location.state || {};

  const [copiedField, setCopiedField] = useState(null);

  // Redirect if no payment data
  React.useEffect(() => {
    if (!transactionId && !prepayId) {
      navigate('/payment', { replace: true });
    }
  }, [transactionId, prepayId, navigate]);

  // Copy to clipboard function
  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleDone = () => {
    // Close the webview using SuperApp bridge
    if (window.payment && typeof window.payment.close === 'function') {
      window.payment.close();
    } else {
      // Fallback: navigate to home if close is not available
      navigate('/');
    }
  };

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

  const accountName = getAccountName();
  const currency = product?.Currency || 'USD';
  const isPaymentSuccessful = success === true || paymentStatus === 'SUCCESS';

  // Determine if AppleTree postPayment was successful (when implemented)
  const appleTreeSuccess = appleTreeResult?.success === true;
  const appleTreeStatus = appleTreeResult?.status;
  const appleTreeReferenceNumber = appleTreeResult?.referenceNumber;
  const appleTreeMessage = appleTreeResult?.resultMessage || appleTreeResult?.message;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <Header 
        title={isPaymentSuccessful ? "Payment Successful" : "Payment Status"} 
        showBackButton={false}
      />
      
      {/* Main Content - White Background */}
      <div className="bg-white w-full flex-1 flex flex-col">
        <div className="px-6 pb-6 flex-1 overflow-y-auto">
          {/* Success Header */}
          {isPaymentSuccessful && (
            <div className="text-center mb-6 pt-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: colors.app.primaryDark}}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-800 mb-2">
                Payment Successful!
              </p>
              <p className="text-xs text-gray-600">
                Your bill payment has been processed successfully
              </p>
            </div>
          )}

          {/* Transaction Details */}
          <div className="bg-white text-black rounded-xl shadow-md p-4 border border-gray-100 mb-6">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Transaction Details</h3>
            <div className="space-y-2">
              {transactionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transaction ID</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs">{transactionId}</span>
                    <button
                      onClick={() => copyToClipboard(transactionId, 'transactionId')}
                      className="p-1 rounded transition-colors hover:bg-gray-100"
                      title="Copy Transaction ID"
                    >
                      {copiedField === 'transactionId' ? (
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {appleTreeReferenceNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Reference Number</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold" style={{color: colors.text.primary}}>
                      {appleTreeReferenceNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(appleTreeReferenceNumber, 'referenceNumber')}
                      className="p-1 rounded transition-colors hover:bg-gray-100"
                      title="Copy Reference Number"
                    >
                      {copiedField === 'referenceNumber' ? (
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {provider && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Provider</span>
                  <span className="font-medium">{provider.Name || 'N/A'}</span>
                </div>
              )}
              {product && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Product</span>
                  <span className="font-medium">{product.Name || 'N/A'}</span>
                </div>
              )}
              {accountValue && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Account Number</span>
                  <span className="font-medium">{accountValue}</span>
                </div>
              )}
              {accountName && accountName !== accountValue && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Account Name</span>
                  <span className="font-medium">{accountName}</span>
                </div>
              )}
              {country && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Country</span>
                  <span className="font-medium">{country.countryName || 'N/A'}</span>
                </div>
              )}
              {service && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium">{service.Name || 'N/A'}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-medium">{formatCurrencyCode(amount || 0, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-base font-bold">
                <span>Total Paid</span>
                <span style={{color: colors.app.primaryDarker}}>{formatCurrencyCode(amount || 0, currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment Status / Delivery Status */}
          {appleTreeResult && (
            <div className={`rounded-lg p-4 border mb-6 ${
              appleTreeSuccess 
                ? '' 
                : 'bg-yellow-50 border-yellow-200'
            }`} style={
              appleTreeSuccess 
                ? {backgroundColor: colors.app.primaryDark, borderColor: colors.app.primary}
                : {}
            }>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  appleTreeSuccess 
                    ? '' 
                    : 'bg-yellow-500'
                }`} style={
                  appleTreeSuccess ? {backgroundColor: colors.app.primary} : {}
                }>
                  {appleTreeSuccess ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${
                    appleTreeSuccess ? 'text-white' : 'text-yellow-800'
                  }`}>
                    {appleTreeSuccess 
                      ? 'Payment Fulfilled' 
                      : 'Fulfillment Pending'}
                  </p>
                  <p className={`text-xs ${
                    appleTreeSuccess ? 'text-gray-200' : 'text-yellow-700'
                  }`}>
                    {appleTreeSuccess 
                      ? `Payment of ${formatCurrencyCode(amount || 0, currency)} has been processed for ${accountValue}`
                      : appleTreeMessage || 'Payment is being processed. Please contact support if the issue persists'}
                  </p>
                  {appleTreeReferenceNumber && (
                    <p className={`text-xs mt-1 ${
                      appleTreeSuccess ? 'text-gray-300' : 'text-yellow-600'
                    }`}>
                      Reference: {appleTreeReferenceNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Display Validation Data (if available) */}
          {validationData && validationData.DisplayData && validationData.DisplayData.length > 0 && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <h3 className="font-bold text-sm text-emerald-800 mb-3">Account Information</h3>
              <div className="space-y-2">
                {validationData.DisplayData.map((item, index) => {
                  if (!item.Value || item.Value.trim() === '') {
                    return null;
                  }
                  return (
                    <div key={index} className="flex flex-col">
                      <span className="text-xs font-medium text-gray-600 mb-1">{item.Label}</span>
                      <span className="text-sm text-gray-800 whitespace-pre-line">{item.Value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with Done Button */}
      <div className="p-6 bg-white border-t border-gray-100">
        <Button
          onClick={handleDone}
          className="w-full"
        >
          Done
        </Button>
      </div>
    </div>
  );
};

export default Confirmation;

