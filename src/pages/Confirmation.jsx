import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import { colors } from '../data/colors';
import PageWrapper from '../components/PageWrapper';

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
    postPaymentResult
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
  const fulfillmentResult = postPaymentResult || null;
  const fulfillmentStatus = fulfillmentResult?.status;
  const fulfillmentSuccess = fulfillmentResult?.success === true;
  const fulfillmentMessage = fulfillmentResult?.resultMessage;
  const fulfillmentReferenceNumber = fulfillmentResult?.referenceNumber;
  const fulfillmentRequestId = fulfillmentResult?.requestId;
  const vouchers = fulfillmentResult?.vouchers || [];
  const receiptHTML = fulfillmentResult?.receiptHTML || [];
  const receiptSmses = fulfillmentResult?.receiptSmses || [];
  const fulfillmentDisplayData = fulfillmentResult?.displayData || [];

  return (
    <PageWrapper>
      {/* Header */}
      <Header title={isPaymentSuccessful ? "Payment Successful" : "Payment Status"} showBackButton={false} />
      <div className="bg-white w-full flex-1 flex flex-col mt-4 rounded-3xl">
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
              {product?.Id && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Product ID</span>
                  <span className="font-medium">{product.Id}</span>
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

          {/* Fulfillment Status */}
          {fulfillmentResult && (
            <div
              className={`rounded-lg p-4 border mb-6 ${fulfillmentSuccess ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-amber-50 border-amber-200 text-amber-900'}`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: fulfillmentSuccess ? colors.app.primary : '#F59E0B'
                  }}
                >
                  {fulfillmentSuccess ? (
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
                  <p className={`font-semibold text-sm ${fulfillmentSuccess ? 'text-white' : 'text-amber-900'}`}>
                    {fulfillmentSuccess ? 'Payment Fulfilled' : 'Fulfillment Pending'}
                  </p>
                  <p className={`text-xs mt-1 ${fulfillmentSuccess ? 'text-gray-100' : 'text-amber-700'}`}>
                    {fulfillmentMessage ||
                      (fulfillmentSuccess
                        ? `Payment of ${formatCurrencyCode(amount || 0, currency)} has been processed for ${accountValue}`
                        : 'The biller has not yet confirmed this transaction. Please try again shortly.')}
                  </p>
                  {fulfillmentReferenceNumber && (
                    <p className={`text-xs mt-2 ${fulfillmentSuccess ? 'text-gray-200' : 'text-amber-700'}`}>
                      Reference: {fulfillmentReferenceNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fulfillment Debug */}
          {fulfillmentResult && (
            <div className="mb-6 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/80 p-4">
              <p className="text-xs font-semibold text-emerald-900 mb-2">Fulfillment Debug</p>
              <div className="space-y-1 text-[11px] text-emerald-900">
                <p><span className="font-semibold uppercase">Status:</span> {fulfillmentStatus || 'N/A'}</p>
                {fulfillmentReferenceNumber && (
                  <p><span className="font-semibold">Reference:</span> {fulfillmentReferenceNumber}</p>
                )}
                {fulfillmentRequestId && (
                  <p><span className="font-semibold">RequestId:</span> {fulfillmentRequestId}</p>
                )}
                <p><span className="font-semibold">Result Message:</span> {fulfillmentMessage || 'N/A'}</p>
                {fulfillmentResult?._requestPayload && (
                  <div className="mt-2">
                    <p className="font-semibold mb-1">Request Payload:</p>
                    <pre className="max-h-48 overflow-y-auto rounded-lg bg-white/90 p-2 text-[10px] text-emerald-900">
                      {JSON.stringify(fulfillmentResult._requestPayload, null, 2)}
                    </pre>
                  </div>
                )}
                {fulfillmentResult?.raw && (
                  <div className="mt-2">
                    <p className="font-semibold mb-1">Raw Response:</p>
                    <pre className="max-h-48 overflow-y-auto rounded-lg bg-white/70 p-2 text-[10px] text-emerald-900">
                      {JSON.stringify(fulfillmentResult.raw, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fulfillment Display Data */}
          {fulfillmentDisplayData.length > 0 && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <h3 className="font-bold text-sm text-emerald-800 mb-3">Voucher Details</h3>
              <div className="space-y-2">
                {fulfillmentDisplayData.map((item, index) => {
                  if (!item.Value || item.Value.trim() === '') {
                    return null;
                  }
                  return (
                    <div key={`fulfillment-display-${index}`} className="flex flex-col">
                      <span className="text-xs font-medium text-gray-600 mb-1">{item.Label}</span>
                      <span className="text-sm text-gray-800 whitespace-pre-line">{item.Value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vouchers */}
          {vouchers.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-md p-4 border" style={{ borderColor: colors.border.primary }}>
              <h3 className="font-bold mb-3 text-sm" style={{ color: colors.text.primary }}>Voucher Tokens</h3>
              <div className="space-y-3">
                {vouchers.map((voucher, index) => {
                  const expiryDate = voucher.ExpiryDate ? new Date(voucher.ExpiryDate) : null;
                  const daysUntilExpiry = expiryDate
                    ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <div
                      key={`voucher-${index}`}
                      className="rounded-lg p-4 border"
                      style={{
                        background: `linear-gradient(to bottom right, ${colors.background.secondary}, ${colors.app.primary})`,
                        borderColor: colors.border.primary
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-sm" style={{ color: colors.text.primary }}>Token #{index + 1}</h4>
                        {vouchers.length > 1 && (
                          <span className="text-xs px-2 py-1 rounded-full" style={{
                            backgroundColor: colors.state.successLight,
                            color: colors.text.primary
                          }}>
                            {index + 1} of {vouchers.length}
                          </span>
                        )}
                      </div>

                      {voucher.SerialNumber && (
                        <div className="mb-3">
                          <span className="text-xs font-medium" style={{ color: colors.text.secondary }}>Serial Number</span>
                          <p className="font-mono font-semibold text-sm bg-white px-3 py-2 rounded border mt-1" style={{ borderColor: colors.border.primary }}>
                            {voucher.SerialNumber}
                          </p>
                        </div>
                      )}

                      {voucher.VoucherCode && (
                        <div className="mb-3">
                          <span className="text-xs font-medium" style={{ color: colors.text.secondary }}>Token</span>
                          <p className="font-mono font-semibold text-base bg-white px-3 py-2 rounded border mt-1 break-all text-center" style={{ color: colors.app.primaryDark, borderColor: colors.border.secondary }}>
                            {voucher.VoucherCode}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {voucher.ValidDays !== undefined && (
                          <div className="bg-white rounded px-2 py-1 border" style={{ borderColor: colors.border.primary }}>
                            <span style={{ color: colors.text.secondary }}>Valid For:</span>
                            <span className="font-semibold ml-1" style={{ color: colors.text.primary }}>{voucher.ValidDays} days</span>
                          </div>
                        )}
                        {expiryDate && (
                          <div className="bg-white rounded px-2 py-1 border" style={{ borderColor: colors.border.primary }}>
                            <span style={{ color: colors.text.secondary }}>Expires:</span>
                            <span className="font-semibold ml-1" style={{
                              color: daysUntilExpiry !== null && daysUntilExpiry < 7 ? colors.state.error : colors.text.primary
                            }}>
                              {expiryDate.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Receipt HTML */}
          {receiptHTML.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-md p-4 border border-emerald-200">
              <h3 className="font-bold mb-3 text-sm text-emerald-800">Receipt</h3>
              <div className="space-y-3">
                {receiptHTML.map((html, index) => (
                  <div key={`receipt-${index}`} className="rounded-lg border border-emerald-100 overflow-hidden">
                    <div className="px-3 py-2 bg-emerald-600 text-white flex items-center justify-between text-xs">
                      <span>Receipt #{index + 1}</span>
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                    <div className="bg-white p-3 max-h-80 overflow-y-auto text-[11px] text-gray-800">
                      <div dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Receipt SMS */}
          {receiptSmses.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-md p-4 border border-emerald-200">
              <h3 className="font-bold mb-3 text-sm text-emerald-800">Receipt SMS</h3>
              <div className="space-y-2">
                {receiptSmses.map((sms, index) => (
                  <div key={`sms-${index}`} className="text-xs text-gray-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <p className="font-semibold mb-1">Message #{index + 1}</p>
                    <p>{sms}</p>
                  </div>
                ))}
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
      <div className="px-6 pb-10 bg-white border-t border-gray-100 pt-4">
        <Button
          onClick={handleDone}
          className="w-full"
        >
          Done
        </Button>
      </div>
    </PageWrapper>
  );
};

export default Confirmation;

