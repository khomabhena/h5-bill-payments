# SuperApp UserInfo and Cashier Guide

This guide documents how to retrieve user information and pull the payment cashier in the SuperApp integration.

---

## Table of Contents

1. [Getting UserInfo](#getting-userinfo)
   - [Method Overview](#method-overview)
   - [Method 1: Using React Hook (Recommended)](#method-1-using-react-hook-recommended)
   - [Method 2: Using UserService Directly](#method-2-using-userservice-directly)
   - [Method 3: Complete Flow (All-in-One)](#method-3-complete-flow-all-in-one)
   - [Method Chain Breakdown](#method-chain-breakdown)
   - [API Details](#api-details)

2. [Pulling the Cashier](#pulling-the-cashier)
   - [Overview](#overview)
   - [Complete Payment Flow](#complete-payment-flow)
   - [Step-by-Step Cashier Flow](#step-by-step-cashier-flow)
   - [Using PaymentFlowManager](#using-paymentflowmanager)
   - [Direct Cashier Call](#direct-cashier-call)

3. [Code Examples](#code-examples)
   - [React Component Example](#react-component-example)
   - [Standalone Example](#standalone-example)

---

## Getting UserInfo

### Method Overview

To get user information, you need to follow a multi-step authentication flow:

1. **Get URL Token** - Extract `token` from URL query parameters
2. **Get Auth Token** - Call SuperApp SDK to get `authToken`
3. **Get OpenId** - Use URL token to get `openId` from API
4. **Get UserInfo** - Use `authToken` and `openId` to get user information

The final `userInfo` object contains user details including phone number (`msisdn`), user ID, and other profile information.

---

### Method 1: Using React Hook (Recommended)

The easiest and recommended approach for React components:

```javascript
import { useUserAuth } from '../hooks/useUserAuth';

function MyComponent() {
  const { getCompleteUserData, userData, isLoading, error } = useUserAuth();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const result = await getCompleteUserData();
        if (result?.userInfo) {
          setUserInfo(result.userInfo);
          console.log('User Info:', result.userInfo);
          console.log('Phone Number:', result.phoneNumber);
          console.log('OpenId:', result.openId);
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
    };
    fetchUserInfo();
  }, [getCompleteUserData]);

  // userInfo is now available
  return <div>{userInfo?.msisdn}</div>;
}
```

**Location:** `src/hooks/useUserAuth.js`

**Returns:**
```javascript
{
  token: "url_token_here",
  openId: "user_openid_here",
  authToken: "superapp_auth_token_here",
  userInfo: {
    code: "SUC",
    msisdn: "+1234567890",
    // ... other user fields
  },
  phoneNumber: "+1234567890"
}
```

---

### Method 2: Using UserService Directly

If you're not using React or need more control:

```javascript
import { UserService } from './h5-automation-api/superapp/UserService';

const userService = new UserService({
  baseUrl: 'https://appleseed-uat-portal.joypaydev.com',
  appId: 'AE35182511050000001000105000',  // Bill Payments App ID
  serialNo: 'p6TTL7DWcA',  // Bill Payments Serial No
  appSecretKey: 'MoTtljN1P66E2rZ/sDwj3g=='  // Bill Payments Secret Key
});

// Step 1: Get token from URL
const token = new URLSearchParams(window.location.search).get('token');
if (!token) {
  throw new Error('No token found in URL');
}

// Step 2: Get auth token from SuperApp SDK
const authToken = await userService.getAuthToken();

// Step 3: Get openId using the URL token
const openId = await userService.getOpenId(token);

// Step 4: Get userInfo using authToken and openId
const userInfo = await userService.getUserInfo(authToken, openId);

// Step 5: Extract phone number (optional)
const phoneNumber = userService.extractPhoneNumber(userInfo);
```

**Location:** `h5-automation-api/superapp/UserService.js`

---

### Method 3: Complete Flow (All-in-One)

The `UserService` provides a helper method that does everything:

```javascript
import { UserService } from './h5-automation-api/superapp/UserService';

const userService = new UserService();

// Get token from URL
const token = new URLSearchParams(window.location.search).get('token');

// Get auth token
const authToken = await userService.getAuthToken();

// Get everything in one call
const result = await userService.getOpenIdAndUserInfo(token, authToken);

// Access all data
const userInfo = result.userInfo;
const phoneNumber = result.phoneNumber;
const openId = result.openId;
const authToken = result.authToken;
```

**Location:** `h5-automation-api/superapp/UserService.js` (line 343)

---

### Method Chain Breakdown

Here's the complete method chain used in the codebase:

```
Component calls:
  ↓
getCompleteUserData() [useUserAuth hook]
  ↓
getOpenIdAndUserInfo(token, authToken) [UserService]
  ↓
  ├─→ getOpenId(token) [UserService]
  │     └─→ POST /v1/pay/credential/openid
  │
  └─→ getAuthToken() [UserService]
        └─→ window.payment.getAuthToken()
  ↓
getUserInfo(authToken, openId) [UserService]
  └─→ POST /v1/pay/credential/user/info
  ↓
Returns: { userInfo, phoneNumber, openId, authToken, token }
```

---

### API Details

#### 1. Get Auth Token (SuperApp SDK)

**Method:** `UserService.getAuthToken()`

**Implementation:**
```javascript
async getAuthToken() {
  const getAuthTokenRequest = {
    appId: this.appId  // e.g., 'AX35182510130000001000103500'
  };

  return window.payment
    .getAuthToken(getAuthTokenRequest)
    .then(res => {
      return res['authToken'];  // One-time use authorization token
    });
}
```

**Location:** `h5-automation-api/superapp/UserService.js` (line 316)

---

#### 2. Get OpenId

**Method:** `UserService.getOpenId(token)`

**API Endpoint:** `POST /v1/pay/credential/openid`

**Request:**
```javascript
{
  token: "url_token_from_query_params"
}
```

**Headers:**
```
Content-Type: application/json
Authorization: AES appid="...",serial_no="...",nonce_str="...",timestamp="...",signature="..."
```

**Response:**
```javascript
{
  code: "SUC",
  openId: "user_openid_string"
}
```

**Location:** `h5-automation-api/superapp/UserService.js` (line 39)

---

#### 3. Get UserInfo

**Method:** `UserService.getUserInfo(authToken, openId)`

**API Endpoint:** `POST /v1/pay/credential/user/info`

**Request:**
```javascript
{
  openId: "user_openid_string",
  authToken: "superapp_auth_token"
}
```

**Headers:**
```
Content-Type: application/json
Authorization: AES appid="...",serial_no="...",nonce_str="...",timestamp="...",signature="..."
```

**Response:**
```javascript
{
  code: "SUC",
  msisdn: "+1234567890",  // Phone number
  // ... other user profile fields
}
```

**Location:** `h5-automation-api/superapp/UserService.js` (line 105)

**Note:** The method uses AES-GCM signature authentication. The signature is generated automatically by `generateSignature()` method.

---

#### 4. Extract Phone Number

**Method:** `UserService.extractPhoneNumber(userInfo)`

This helper method tries multiple fields to find the phone number:
- Direct fields: `msisdn`, `phone`, `phoneNumber`, `mobile`, `mobileNumber`, `tel`
- Nested fields: `profile.phone`, `contact.phone`

**Location:** `h5-automation-api/superapp/UserService.js` (line 161)

---

## Pulling the Cashier

### Overview

The payment cashier is the UI component that allows users to complete payment. It's pulled using the SuperApp SDK's `window.payment.payOrder()` method after preparing the payment order.

**Prerequisites:**
- Payment order must be prepared first (creates order and generates signature)
- SuperApp SDK must be loaded (`window.payment` must be available)
- Valid payment parameters (`rawData`, `paySign`, `signType`)

---

### Complete Payment Flow

The complete payment flow consists of these steps:

1. **Initialize** - Initialize SuperApp payment service
2. **Prepare Payment** - Create order and generate payment signature
3. **Show Cashier** - Pull the payment cashier UI
4. **Query Status** - (Optional) Check payment status
5. **Post to AppleTree** - (Optional) Send payment to AppleTree for voucher retrieval

---

### Step-by-Step Cashier Flow

#### Step 1: Initialize SuperApp Payment

```javascript
import { SuperAppPayment } from './h5-automation-api/superapp';

const superApp = new SuperAppPayment({
  merchantId: 'MG3518zo1Wd0XlXZzn',
  appId: 'AX35182510130000001000103500',
  serialNo: 'ms8I46zJeW',
  merchantPrivateKey: 'your-private-key-here'
});

await superApp.initialize();
```

**Location:** `h5-automation-api/superapp/SuperAppPayment.js`

---

#### Step 2: Prepare Payment (Create Order + Signature)

```javascript
const orderData = {
  mchId: 'MG3518zo1Wd0XlXZzn',
  appId: 'AX35182510130000001000103500',
  amountCent: 1000,  // Amount in cents (e.g., 1000 = $10.00)
  currency: 'USD',
  description: 'Airtime Top-up',
  callbackInfo: JSON.stringify({
    transactionId: 'unique-transaction-id',
    phoneNumber: '+1234567890',
    bundle: 'Standard Airtime'
  }),
  outBizId: 'ORDER-1234567890',  // Unique order ID
  timeExpire: Math.floor(Date.now() / 1000) + 1800,  // 30 minutes from now
  paymentProduct: 'AIR_TIME'
};

const paymentResult = await superApp.preparePayment(orderData);
// Returns: { paymentParams: { rawData, paySign, signType }, ... }
```

**Location:** `h5-automation-api/superapp/SuperAppPayment.js` (line 142)

**Response Structure:**
```javascript
{
  paymentParams: {
    rawData: "base64_encoded_payment_data",
    paySign: "rsa_signature",
    signType: "SHA256withRSA"
  },
  outBizId: "ORDER-1234567890",
  // ... other fields
}
```

---

#### Step 3: Show Cashier

```javascript
const PayOrderRequest = {
  rawData: paymentResult.paymentParams.rawData,
  paySign: paymentResult.paymentParams.paySign,
  signType: paymentResult.paymentParams.signType || 'SHA256withRSA'
};

const cashierResult = await superApp.showPaymentCashier(PayOrderRequest);
```

**Location:** `h5-automation-api/superapp/SuperAppPayment.js` (line 292)

**Implementation Details:**
- Calls `window.payment.payOrder(PayOrderRequest)`
- Returns a Promise that resolves when user completes payment
- Has a 2-minute timeout
- The cashier UI is displayed by the SuperApp SDK

**Response:**
```javascript
{
  bizId: "business_id",
  orderId: "ORDER-1234567890",
  status: "SUCCESS",  // or "FAIL", "PROCESSING", etc.
  // ... other response fields
}
```

---

### Using PaymentFlowManager (Airtime App)

For airtime payments, use `PaymentFlowManager`:

```javascript
import PaymentFlowManager from './h5-automation-api/superapp/PaymentFlowManager';

const flowManager = new PaymentFlowManager();

// Execute complete payment flow
const result = await flowManager.executePayment(phoneData, selectedBundle, {
  postToAppleTree: true,  // Optional: enable AppleTree integration
  appleTreeService: appleTreeService,  // Optional: AppleTree service instance
  userInfo: userInfo,  // Optional: user info for AppleTree
  onVoucherFetchStart: () => {
    // Optional: callback when voucher fetching starts
    console.log('Fetching voucher...');
  }
});

// Access cashier result
console.log('Cashier Result:', result.cashierResult);
console.log('Payment Status:', result.paymentStatus);
console.log('Transaction ID:', result.transactionId);
```

**Location:** `h5-automation-api/superapp/PaymentFlowManager.js` (line 399)

---

### Using BillPaymentFlowManager (Bill Payments App)

For bill payments (electricity, water, etc.), use `BillPaymentFlowManager`:

```javascript
import BillPaymentFlowManager from './h5-automation-api/superapp/BillPaymentFlowManager';

const flowManager = new BillPaymentFlowManager((type, message, data) => {
  // Optional: logging callback for debug logs
  console.log(`[${type}] ${message}`, data);
});

// Prepare payment data
const paymentData = {
  country: selectedCountry,
  service: selectedService,
  provider: selectedProvider,
  product: selectedProduct,
  accountValue: accountNumber,
  amount: paymentAmount,
  validationData: validationResult  // From ValidatePayment API
};

// Execute complete payment flow
const result = await flowManager.executePayment(paymentData, {
  userInfo: userInfo  // Optional: user info for fulfillment integration
});

// Access cashier result
console.log('Cashier Result:', result.cashierResult);
console.log('Payment Status:', result.paymentStatus);
console.log('Transaction ID:', result.transactionId);
console.log('PostPayment Result:', result.postPaymentResult);
```

**Location:** `h5-automation-api/superapp/BillPaymentFlowManager.js` (line 534)

**Payment Data Structure:**
```javascript
{
  country: { countryCode: 'ZW', countryName: 'Zimbabwe' },
  service: { Id: '5', Name: 'Internet Broadband' },
  provider: { Id: 'PRV_001', Name: 'Provider Name' },
  product: { Id: 'PN_TEST', Name: 'Product Name', Currency: 'USD' },
  accountValue: '1234567890',  // Account number
  amount: 10.00,  // Payment amount
  validationData: {  // From ValidatePayment API response
    Status: 'VALIDATED',
    DisplayData: [
      { Label: 'Account Name', Value: 'John Doe' },
      { Label: 'Outstanding Balance', Value: '50.00' }
    ]
  }
}
```

**Returns:**
```javascript
{
  transactionId: "ORDER-1234567890",
  prepayId: "prepay_id",
  timestamp: 1234567890,
  paymentResult: { /* prepare payment result */ },
  cashierResult: { /* cashier response */ },
  statusResult: { /* payment status */ },
  postPaymentResult: { /* AppleTree PostPayment response */ },
  paymentStatus: "SUCCESS"
}
```

---

### Direct Cashier Call

If you already have payment parameters and just want to show the cashier:

```javascript
// Ensure window.payment is available
if (!window.payment || typeof window.payment.payOrder !== 'function') {
  throw new Error('window.payment.payOrder is not available');
}

// Prepare request
const PayOrderRequest = {
  rawData: "your_raw_data_here",
  paySign: "your_signature_here",
  signType: "SHA256withRSA"
};

// Show cashier
window.payment
  .payOrder(PayOrderRequest)
  .then(result => {
    console.log('Payment successful:', result);
    // Handle success
  })
  .catch(error => {
    console.error('Payment failed:', error);
    // Handle error
  });
```

**Location:** `h5-automation-api/superapp/js-sdk.js` (line 194)

**Note:** The `window.payment.payOrder()` method is provided by the SuperApp JS SDK. Make sure `js-sdk.js` is loaded before calling this.

---

## Code Examples

### React Component Example (Bill Payments)

Complete example showing both userInfo retrieval and cashier for bill payments:

```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '../hooks/useUserAuth';
import BillPaymentFlowManager from '../../h5-automation-api/superapp/BillPaymentFlowManager';

function PaymentComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { country, service, provider, product, accountValue, amount, validationData } = location.state || {};
  
  const { getCompleteUserData, userData } = useUserAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Get user info on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const result = await getCompleteUserData();
        if (result?.userInfo) {
          setUserInfo(result.userInfo);
        }
      } catch (err) {
        console.log('Could not fetch user info (non-critical):', err.message);
      }
    };
    fetchUserInfo();
  }, [getCompleteUserData]);

  // Handle payment (pulls cashier)
  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Initialize BillPaymentFlowManager with logging callback
      const flowManager = new BillPaymentFlowManager((type, message, data) => {
        console.log(`[${type}] ${message}`, data);
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

      // Execute payment flow
      const result = await flowManager.executePayment(paymentData, {
        userInfo: userInfo || userData?.userInfo || null
      });

      console.log('Payment successful!');
      console.log('Cashier Result:', result.cashierResult);
      console.log('Transaction ID:', result.transactionId);
      console.log('PostPayment Result:', result.postPaymentResult);
      
      // Navigate to confirmation page
      navigate('/confirmation', { state: { ...result, paymentData } });
    } catch (error) {
      setError(error.message);
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {userInfo && <p>User: {userInfo.msisdn}</p>}
      <button onClick={handlePayment} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

---

### Standalone Example (Bill Payments)

Non-React example showing the complete flow for bill payments:

```javascript
import { UserService } from './h5-automation-api/superapp/UserService';
import BillPaymentFlowManager from './h5-automation-api/superapp/BillPaymentFlowManager';

async function processBillPayment() {
  try {
    // Step 1: Get user info
    const userService = new UserService();
    const token = new URLSearchParams(window.location.search).get('token');
    const authToken = await userService.getAuthToken();
    const userData = await userService.getOpenIdAndUserInfo(token, authToken);
    
    console.log('User Info:', userData.userInfo);
    console.log('Phone Number:', userData.phoneNumber);

    // Step 2: Prepare payment data
    const paymentData = {
      country: { countryCode: 'ZW', countryName: 'Zimbabwe' },
      service: { Id: '5', Name: 'Internet Broadband' },
      provider: { Id: 'PRV_001', Name: 'Provider Name' },
      product: { Id: 'PN_TEST', Name: 'Product Name', Currency: 'USD' },
      accountValue: '1234567890',
      amount: 10.00,
      validationData: {
        Status: 'VALIDATED',
        DisplayData: [
          { Label: 'Account Name', Value: 'John Doe' }
        ]
      }
    };

    // Step 3: Process payment (includes cashier)
    const flowManager = new BillPaymentFlowManager();
    const paymentResult = await flowManager.executePayment(paymentData, {
      userInfo: userData.userInfo
    });

    console.log('Payment completed:', paymentResult);
    console.log('Cashier Result:', paymentResult.cashierResult);
    console.log('Transaction ID:', paymentResult.transactionId);
    console.log('PostPayment Result:', paymentResult.postPaymentResult);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

processBillPayment();
```

---

## Important Notes

### UserInfo Retrieval

- **URL Token Required:** The `token` parameter must be present in the URL query string (`?token=...`)
- **SuperApp SDK Required:** `window.payment` must be available for `getAuthToken()`
- **AES Signature:** All API calls use AES-GCM signature authentication (handled automatically)
- **Error Handling:** The flow can fail at any step - handle errors appropriately
- **Non-Critical:** UserInfo retrieval is optional for payment flow (payment can proceed without it)

### Cashier

- **Order Preparation Required:** Must call `preparePayment()` before showing cashier
- **SDK Availability:** `window.payment.payOrder()` must be available
- **Timeout:** Cashier call has a 2-minute timeout
- **User Interaction:** Cashier is a modal UI - user must interact to complete payment
- **Response Handling:** Cashier returns a Promise that resolves when payment is complete

### Configuration

Default configuration values (can be overridden):

**Bill Payments App Configuration:**
```javascript
{
  baseUrl: 'https://appleseed-uat-portal.joypaydev.com',
  appId: 'AE35182511050000001000105000',
  serialNo: 'p6TTL7DWcA',
  appSecretKey: 'MoTtljN1P66E2rZ/sDwj3g==',
  merchantId: 'MG3518zo1Wd0XlXZzn'
}
```

**Note:** These are the default credentials for the Bill Payments app. They are automatically used when creating `UserService` or `SuperAppPayment` instances without passing config.

---

## File Locations

- **UserService:** `h5-automation-api/superapp/UserService.js`
- **useUserAuth Hook:** `src/hooks/useUserAuth.js`
- **PaymentFlowManager:** `h5-automation-api/superapp/PaymentFlowManager.js` (Airtime app)
- **BillPaymentFlowManager:** `h5-automation-api/superapp/BillPaymentFlowManager.js` (Bill Payments app)
- **SuperAppPayment:** `h5-automation-api/superapp/SuperAppPayment.js`
- **JS SDK:** `public/superapp/js-sdk.js`
- **Example Usage (Bill Payments):** `src/pages/Payment.jsx`

---

## Troubleshooting

### UserInfo Issues

**Problem:** "No token found in URL"
- **Solution:** Ensure the URL contains `?token=...` parameter

**Problem:** "window.payment is not available"
- **Solution:** Ensure SuperApp JS SDK (`js-sdk.js`) is loaded before calling methods

**Problem:** "Failed to get user info: HTTP error"
- **Solution:** Check API credentials (appId, serialNo, appSecretKey) and network connectivity

### Cashier Issues

**Problem:** "window.payment.payOrder is not a function"
- **Solution:** Ensure `js-sdk.js` is loaded and `window.payment` is initialized

**Problem:** "Cashier call timeout after 2 minutes"
- **Solution:** User may not have completed payment. Check if cashier UI is visible and user is interacting

**Problem:** "paymentResult.paymentParams is undefined"
- **Solution:** Ensure `preparePayment()` completed successfully before calling `showCashier()`

---

## Additional Resources

- SuperApp SDK Documentation
- Payment API Documentation
- AppleTree Integration Guide

