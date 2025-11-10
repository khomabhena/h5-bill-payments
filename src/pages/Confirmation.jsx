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
  const appleTreeDisplayData = appleTreeResult?.displayData || appleTreeResult?.DisplayData || [];
  const vouchers = appleTreeResult?.vouchers || appleTreeResult?.Vouchers || [];
  const receiptHTML = appleTreeResult?.receiptHTML || appleTreeResult?.ReceiptHTML || [];
  const receiptSmses = appleTreeResult?.receiptSmses || appleTreeResult?.ReceiptSmses || [];
  const appleTreeRequestId = appleTreeResult?.requestId || appleTreeResult?.RequestId;

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

          {/* PostPayment Debug Log */}
          <div className="mb-6 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/80 p-4">
            <p className="text-xs font-semibold text-emerald-900 mb-2">AppleTree PostPayment Debug Log</p>
            {appleTreeResult ? (
              <div className="space-y-1 text-[11px] text-emerald-900">
                <p><span className="font-semibold uppercase">Status:</span> {appleTreeResult.Status || 'N/A'}</p>
                {appleTreeReferenceNumber && (
                  <p><span className="font-semibold">Reference:</span> {appleTreeReferenceNumber}</p>
                )}
                {appleTreeRequestId && (
                  <p><span className="font-semibold">RequestId:</span> {appleTreeRequestId}</p>
                )}
                <p><span className="font-semibold">Result Message:</span> {appleTreeMessage || 'N/A'}</p>
                <p><span className="font-semibold">Vouchers Returned:</span> {vouchers.length}</p>
                <p><span className="font-semibold">Receipt HTML:</span> {receiptHTML.length}</p>
                <p><span className="font-semibold">Receipt SMS:</span> {receiptSmses.length}</p>
                <div className="mt-2">
                  <p className="font-semibold mb-1">Raw Response:</p>
                  <pre className="max-h-48 overflow-y-auto rounded-lg bg-white/70 p-2 text-[10px] text-emerald-900">
                    {JSON.stringify(appleTreeResult, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-emerald-900">No AppleTree PostPayment response was received for this payment.</p>
            )}
          </div>

          {/* AppleTree Display Data */}
          {appleTreeDisplayData && appleTreeDisplayData.length > 0 && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <h3 className="font-bold text-sm text-emerald-800 mb-3">Fulfillment Details</h3>
              <div className="space-y-2">
                {appleTreeDisplayData.map((item, index) => {
                  if (!item.Value || item.Value.trim() === '') {
                    return null;
                  }
                  return (
                    <div key={`apple-tree-display-${index}`} className="flex flex-col">
                      <span className="text-xs font-medium text-gray-600 mb-1">{item.Label}</span>
                      <span className="text-sm text-gray-800 whitespace-pre-line">{item.Value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vouchers Display */}
          {vouchers && vouchers.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-md p-4 border" style={{borderColor: colors.border.primary}}>
              <h3 className="font-bold mb-3 text-sm" style={{color: colors.text.primary}}>Voucher Details</h3>
              <div className="space-y-3">
                {vouchers.map((voucher, index) => {
                  const voucherKey = `voucher-${index}`;
                  const serialKey = `${voucherKey}-serial`;
                  const codeKey = `${voucherKey}-code`;
                  const expiryDate = voucher.ExpiryDate ? new Date(voucher.ExpiryDate) : null;
                  const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

                  return (
                    <div key={voucherKey} className="rounded-lg p-4 border" style={{
                      background: `linear-gradient(to bottom right, ${colors.background.secondary}, ${colors.app.primary})`,
                      borderColor: colors.border.primary
                    }}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-sm" style={{color: colors.text.primary}}>Voucher #{index + 1}</h4>
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
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium" style={{color: colors.text.secondary}}>Serial Number</span>
                            <button
                              onClick={() => copyToClipboard(voucher.SerialNumber, serialKey)}
                              className="p-1 rounded transition-colors"
                              style={{backgroundColor: 'transparent'}}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background.secondary}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              title="Copy Serial Number"
                            >
                              {copiedField === serialKey ? (
                                <svg className="w-4 h-4" style={{color: colors.state.success}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" style={{color: colors.text.secondary}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                          <p className="font-mono font-bold text-sm bg-white px-3 py-2 rounded border" style={{borderColor: colors.border.primary, color: colors.text.primary}}>
                            {voucher.SerialNumber}
                          </p>
                        </div>
                      )}

                      {voucher.VoucherCode && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium" style={{color: colors.text.secondary}}>Voucher Code</span>
                            <button
                              onClick={() => copyToClipboard(voucher.VoucherCode, codeKey)}
                              className="p-1 rounded transition-colors"
                              style={{backgroundColor: 'transparent'}}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background.secondary}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              title="Copy Voucher Code"
                            >
                              {copiedField === codeKey ? (
                                <svg className="w-4 h-4" style={{color: colors.state.success}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" style={{color: colors.text.secondary}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                          <p className="font-mono font-bold text-base bg-white px-3 py-2 rounded border break-all text-center" style={{color: colors.app.primaryDark, borderColor: colors.border.secondary}}>
                            {voucher.VoucherCode}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {voucher.ValidDays && (
                          <div className="bg-white rounded px-2 py-1 border" style={{borderColor: colors.border.primary}}>
                            <span style={{color: colors.text.secondary}}>Valid for:</span>
                            <span className="font-semibold ml-1" style={{color: colors.text.primary}}>{voucher.ValidDays} days</span>
                          </div>
                        )}
                        {expiryDate && (
                          <div className="bg-white rounded px-2 py-1 border" style={{borderColor: colors.border.primary}}>
                            <span style={{color: colors.text.secondary}}>Expires:</span>
                            <span className="font-semibold ml-1" style={{
                              color: daysUntilExpiry !== null && daysUntilExpiry < 7 ? colors.state.error : colors.text.primary
                            }}>
                              {expiryDate.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {daysUntilExpiry !== null && daysUntilExpiry >= 0 && (
                        <div className="mt-2 text-xs text-center">
                          <span className="font-medium" style={{
                            color: daysUntilExpiry < 7 
                              ? colors.state.error 
                              : daysUntilExpiry < 30 
                                ? colors.state.warning 
                                : colors.state.success
                          }}>
                            {daysUntilExpiry === 0 
                              ? 'Expires today' 
                              : daysUntilExpiry === 1 
                                ? 'Expires tomorrow'
                                : `Expires in ${daysUntilExpiry} days`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Receipt HTML Display */}
          {receiptHTML && receiptHTML.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-md p-4 border" style={{borderColor: colors.border.secondary}}>
              <h3 className="font-bold mb-3 text-sm" style={{color: colors.text.primary}}>Receipt</h3>
              <div className="space-y-4">
                {receiptHTML.map((html, index) => (
                  <div key={`receipt-${index}`} className="border rounded-lg p-4 bg-gray-50" style={{borderColor: colors.border.primary}}>
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Receipt SMS Display */}
          {receiptSmses && receiptSmses.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-md p-4 border" style={{borderColor: colors.border.secondary}}>
              <h3 className="font-bold mb-3 text-sm" style={{color: colors.text.primary}}>Receipt SMS</h3>
              <div className="space-y-2">
                {receiptSmses.map((sms, index) => (
                  <div key={`sms-${index}`} className="p-3 bg-gray-50 rounded border" style={{borderColor: colors.border.primary}}>
                    <p className="text-xs text-gray-600 mb-1">Message #{index + 1}</p>
                    <p className="text-sm text-gray-800 whitespace-pre-line">{sms}</p>
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

