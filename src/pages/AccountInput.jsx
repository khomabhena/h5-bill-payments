import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import CountryInputField from '../components/CountryInputField';
import { colors } from '../data/colors';
import PageWrapper from '../components/PageWrapper';
import { validatePayment } from '../../h5-automation-api/appletree';
import AppleTreeGateway from '../../h5-automation-api/appletree/AppleTreeGateway';
import { getDisplayIdentifierLabel } from '../utils/identifierLabel';

const AccountInput = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { country, service, provider, product } = location.state || {};

  const [accountValue, setAccountValue] = useState('');
  const [amount, setAmount] = useState('');
  const [validationData, setValidationData] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const validationTimeoutRef = useRef(null);
  const currentValidationRequestRef = useRef(null); // Track current validation request ID

  // Calculate if amount is fixed
  const minAmount = product?.MinimumAmount || 0;
  const maxAmount = product?.MaximumAmount || 0;
  const productPrice = product?.Price || 0;
  const currency = product?.Currency || 'USD';
  
  // Amount is fixed if:
  // 1. Price > 0, OR
  // 2. MinAmount === MaxAmount and both > 0 (use tolerance for floating point comparison)
  const amountsEqual = minAmount > 0 && maxAmount > 0 && Math.abs(minAmount - maxAmount) < 0.01;
  const isFixedAmount = productPrice > 0 || amountsEqual;
  const fixedAmount = isFixedAmount ? (productPrice > 0 ? productPrice : minAmount) : null;

  // Set fixed amount on mount
  useEffect(() => {
    if (product) {
      if (isFixedAmount && fixedAmount) {
        setAmount(fixedAmount.toString());
      } else if (minAmount > 0) {
        // Pre-fill with minimum amount if available
        setAmount(minAmount.toString());
      }
    }
  }, [product?.Id]); // Only run when product changes

  // Redirect if no product selected
  useEffect(() => {
    if (!product || !country || !service || !provider) {
      navigate('/products', { replace: true });
    }
  }, [product, country, service, provider, navigate]);

  // Get credit party identifier info from product
  const creditPartyIdentifier = product?.CreditPartyIdentifiers?.[0];
  const fieldLabel = getDisplayIdentifierLabel(
    creditPartyIdentifier?.Title,
    {
      serviceName: service?.Name,
      providerName: provider?.Name,
      productName: product?.Name
    }
  );
  const fieldName = creditPartyIdentifier?.Name || 'AccountNumber';

  // Get customer details (should come from SuperApp SDK - window.payment.getUserInfo())
  // For now, using placeholder values. TODO: Integrate with SuperApp SDK
  const getCustomerDetails = () => {
    // TODO: Get from window.payment.getUserInfo() or similar SuperApp SDK method
    // For now, using mock values similar to the payload example
    return {
      CustomerId: '1L', // Should come from SuperApp SDK
      Fullname: '1L', // Should come from SuperApp SDK
      MobileNumber: '+263777077921', // Should come from SuperApp SDK
      EmailAddress: null // Should come from SuperApp SDK
    };
  };

  // Validate account number - memoized with useCallback
  // Use refs to get current values without triggering re-validation on amount change
  const amountRef = useRef(amount);
  const accountValueRef = useRef(accountValue);
  
  // Update refs when values change
  useEffect(() => {
    amountRef.current = amount;
  }, [amount]);
  
  useEffect(() => {
    accountValueRef.current = accountValue;
  }, [accountValue]);

  const performValidation = useCallback(async () => {
    // Use refs to get current values (always up-to-date, but don't trigger re-validation)
    const currentAccountValue = accountValueRef.current;
    const currentAmount = amountRef.current;
    
    if (!currentAccountValue.trim() || !product) {
      return;
    }

    // Generate a unique request ID for this validation attempt
    const requestId = AppleTreeGateway.generateRequestId();
    currentValidationRequestRef.current = requestId;

    setValidating(true);
    setValidationError(null); // Clear any previous error when starting new validation
    // Don't clear validationData immediately - keep it until we get a response
    // This way, if validation is in progress, we still show the previous successful validation

    try {
      const amountValue = parseFloat(currentAmount) || 0;
      const customerDetails = getCustomerDetails();

      const validationPayload = {
        RequestId: requestId,
        Amount: amountValue,
        CreditPartyIdentifiers: [
          {
            IdentifierFieldName: fieldName,
            IdentifierFieldValue: currentAccountValue.trim()
          }
        ],
        Currency: currency,
        CustomerDetails: customerDetails,
        POSDetails: {
          CashierId: '1L',
          StoreId: '1L',
          TerminalId: '1L'
        },
        ProductId: product.Id,
        Quantity: 1
      };

      console.log('Validating payment with payload:', validationPayload);

      const response = await validatePayment(validationPayload);

      console.log('Validation response:', response);

      // Only update state if this is still the current validation request
      // This prevents stale responses from overwriting newer ones
      if (currentValidationRequestRef.current === requestId) {
        if (response.Status === 'VALIDATED') {
          // Validation succeeded - clear any previous errors
          setValidationData(response);
          setValidationError(null); // Explicitly clear error
        } else {
          // Validation failed - show user-friendly message
          setValidationError(response.ResultMessage || 'Failed to validate account details.');
          setValidationData(null); // Clear any previous validation data
        }
        setValidating(false);
      } else {
        console.log('Ignoring stale validation response for request:', requestId);
      }
    } catch (error) {
      console.error('Validation error:', error);
      
      // Only update state if this is still the current validation request
      if (currentValidationRequestRef.current === requestId) {
        // Check if it's a network error
        const isNetworkError = error.message?.includes('Failed to fetch') ||
                              error.message?.includes('NetworkError') ||
                              error.name === 'TypeError';

        if (isNetworkError) {
          setValidationError('Network connection issue. Please check your internet connection and try again.');
        } else {
          // Validation failed - show user-friendly message (not technical details)
          const resultMessage = error?.debugInfo?.responseBody?.ResultMessage || error?.message;
          setValidationError(resultMessage || 'Failed to validate account details.');
        }
        
        setValidationData(null);
        setValidating(false);
      } else {
        console.log('Ignoring stale validation error for request:', requestId);
      }
    }
  }, [product, fieldName, currency]); // Removed accountValue and amount from dependencies

  // Debounced validation - trigger 1 second after user stops typing
  // Only trigger when accountValue changes, not when amount changes
  // This prevents re-validation when user just changes the amount
  useEffect(() => {
    // Clear existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Always validate if account value has content
    if (accountValue.trim().length > 0) {
      validationTimeoutRef.current = setTimeout(() => {
        performValidation();
      }, 1000); // 1 second delay
    } else {
      // Clear validation data and error if account is empty
      setValidationData(null);
      setValidationError(null);
      setValidating(false); // Also clear validating state
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [accountValue, performValidation]); // performValidation is stable (uses refs), so won't trigger on amount change

  const handleContinue = () => {
    const amountValue = parseFloat(amount);
    
    if (product && country && service && provider) {
      navigate('/payment', {
        state: {
          country,
          service,
          provider,
          product,
          accountValue,
          amount: amountValue,
          validationData: validationData // Pass validation data to next screen
        },
      });
    }
  };

  if (!product || !country || !service || !provider) {
    return null; // Will redirect
  }

  const amountValue = parseFloat(amount);
  const hasValidAmount = amount && !isNaN(amountValue) && amountValue > 0;
  const hasValidAccount = accountValue.trim().length > 0;
  
  // Check if validation has failed
  // Show warning only if:
  // 1. We're not currently validating, AND
  // 2. Validation has actually failed (not succeeded)
  // If validationData.Status === 'VALIDATED', validation succeeded - don't show warning
  const isValidationSuccessful = validationData && validationData.Status === 'VALIDATED';
  const hasValidationFailed = !validating && !isValidationSuccessful && (
    validationError || 
    (validationData && validationData.Status && validationData.Status !== 'VALIDATED')
  );
  
  // Allow continue with account and amount (validation runs but doesn't block)
  const canContinue = hasValidAccount && hasValidAmount;

  return (
    <PageWrapper>
      {/* Header */}
      <Header title={`Enter ${fieldLabel}`} showBackButton={true} />

      {/* Main Content Section - White Background */}
      <div className="bg-white w-full flex-1 flex flex-col mt-4 rounded-3xl">
        <div className="px-6 pb-6 flex-1">
          {/* Product Info Display */}
          <div className="mb-6 pt-4">
            <div className="flex items-center justify-center mb-2">
              {provider.LogoURL ? (
                <img 
                  src={provider.LogoURL} 
                  alt={provider.Name}
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <span className={`text-4xl ${provider.LogoURL ? 'hidden' : 'block'}`}>🏢</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">{product.Name}</p>
              <p className="text-xs text-gray-500">{provider.Name}</p>
            </div>
          </div>

          {/* Account Input Field */}
          <div className="mb-4">
            <CountryInputField
              type="text"
              label={fieldLabel}
              placeholder={`Enter ${fieldLabel.toLowerCase()}`}
              value={accountValue}
              onChange={(e) => setAccountValue(e.target.value)}
              customColors={colors}
            />
            
            {/* Validation Loading Indicator */}
            {validating && (
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <svg className="animate-spin h-4 w-4 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validating account...
              </div>
            )}
          </div>

          {/* Error Display - Using brand colors */}
          {validationError && (
            <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.primary, borderWidth: '1px', borderStyle: 'solid' }}>
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 mt-0.5 shrink-0" style={{ color: colors.app.primaryDark }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: colors.app.primaryDark }}>{validationError}</p>
                </div>
              </div>
            </div>
          )}


          {/* Display Validation Data */}
          {validationData && validationData.DisplayData && validationData.DisplayData.length > 0 && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-semibold text-emerald-800">Account Verified</h3>
              </div>
              
              <div className="space-y-2">
                {validationData.DisplayData.map((item, index) => {
                  // Skip items with null or empty values
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

              {/* Bill Amount Display (if available) */}
              {validationData.BillAmount !== undefined && validationData.BillAmount !== null && (
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600">Bill Amount:</span>
                    <span className="text-sm font-semibold text-emerald-700">
                      {currency} {validationData.BillAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount Input Field */}
          <div className="mb-4">
            <CountryInputField
              type="number"
              label="Payment Amount"
              placeholder={isFixedAmount ? "Fixed amount" : `Enter amount (${currency})`}
              value={amount}
              onChange={(e) => {
                if (!isFixedAmount) {
                  setAmount(e.target.value);
                }
              }}
              disabled={isFixedAmount}
              customColors={colors}
              rightIcon={
                <span className="text-sm font-medium text-gray-600 pr-2">
                  {currency.toUpperCase()}
                </span>
              }
            />
            
            {/* Amount limits display */}
            {(minAmount > 0 || maxAmount > 0) && (
              <div className="mt-1 text-xs text-gray-500">
                {/* If min and max are equal (within 0.01 tolerance), show single amount */}
                {minAmount > 0 && maxAmount > 0 && Math.abs(minAmount - maxAmount) < 0.01 && (
                  <span>Amount: {currency} {minAmount.toFixed(2)}</span>
                )}
                {/* Show range only if min and max are different */}
                {minAmount > 0 && maxAmount > 0 && Math.abs(minAmount - maxAmount) >= 0.01 && (
                  <span>Min: {currency} {minAmount.toFixed(2)} - Max: {currency} {maxAmount.toFixed(2)}</span>
                )}
                {/* Show only minimum if no maximum */}
                {minAmount > 0 && maxAmount === 0 && (
                  <span>Minimum: {currency} {minAmount.toFixed(2)}</span>
                )}
                {/* Show only maximum if no minimum */}
                {minAmount === 0 && maxAmount > 0 && (
                  <span>Maximum: {currency} {maxAmount.toFixed(2)}</span>
                )}
              </div>
            )}
            
            {isFixedAmount && productPrice > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                Fixed amount for this product
              </div>
            )}
          </div>

        </div>

        {/* Warning Message - Above button, similar to airtime app when validation fails */}
        {hasValidationFailed && !validating && (
          <div className="px-6 pb-3">
            <div className="rounded-lg p-3" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.primary, borderWidth: '1px', borderStyle: 'solid' }}>
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 mt-0.5 shrink-0" style={{ color: colors.state.warning }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: colors.app.primaryDark }}>
                    We do not recognise the account details. Are you sure you want to continue?
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Button at Bottom */}
        <div className="px-6 pb-10 space-y-3">
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AccountInput;

