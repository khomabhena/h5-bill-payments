# AppleTree Gateway API Analysis - Bill Payments

## Overview

This document provides a comprehensive analysis of the AppleTree Gateway API Postman collection for the Bill Payments mini app. It covers API structure, endpoints, request/response patterns, and implementation considerations.

---

## API Base URLs

### Gateway API (Discovery & Validation)
- **Base URL**: `https://sandbox-dev.appletreepayments.com/vas/V2/`
- **Purpose**: Country/service/product discovery, account validation

### PostPayment API (Payment Processing)
- **Base URL**: `https://sandbox-apg.azurewebsites.net/billpayments/v2/`
- **Purpose**: Process payments after SuperApp payment succeeds
- **Note**: Different domain from Gateway API

---

## Authentication

All endpoints require the `MerchantId` header:

```
MerchantId: 23de4621-ea24-433f-9b45-dc1e383d8c2b
```

---

## Endpoints

### 1. Get Countries
**Endpoint**: `GET /vas/V2/Countries`

**Headers**:
- `MerchantId`: `23de4621-ea24-433f-9b45-dc1e383d8c2b`

**Response**:
```json
{
    "Status": "FOUND",
    "ResultMessage": "Request processed successfully.",
    "Countries": [
        {
            "Code": "ZW",
            "Name": "Zimbabwe"
        },
        {
            "Code": "ZA",
            "Name": "South Africa"
        }
        // ... more countries
    ]
}
```

**Notes**:
- Returns list of supported countries
- Some countries may have duplicate codes (data quality issue)

---

### 2. Get Services
**Endpoint**: `GET /vas/V2/Services`

**Headers**:
- `MerchantId`: `23de4621-ea24-433f-9b45-dc1e383d8c2b`

**Response**:
```json
{
    "Status": "FOUND",
    "ResultMessage": "Request processed successfully.",
    "Services": [
        {
            "Id": 1,
            "Name": "Mobile Airtime"
        },
        {
            "Id": 2,
            "Name": "Mobile Data"
        },
        {
            "Id": 3,
            "Name": "Mobile Bundles"
        },
        {
            "Id": 5,
            "Name": "Internet Broadband"
        },
        {
            "Id": 6,
            "Name": "Electricity"
        },
        {
            "Id": 8,
            "Name": "Gas"
        },
        {
            "Id": 9,
            "Name": "Education"
        },
        {
            "Id": 10,
            "Name": "Insurance"
        },
        {
            "Id": 12,
            "Name": "Phone"
        },
        {
            "Id": 13,
            "Name": "Television"
        },
        {
            "Id": 17,
            "Name": "Local Authorities"
        },
        {
            "Id": 18,
            "Name": "Retail Shops"
        }
    ]
}
```

**Bill Payment Service IDs**:
- `5` - Internet Broadband
- `6` - Electricity
- `8` - Gas
- `9` - Education
- `10` - Insurance
- `12` - Phone
- `13` - Television
- `17` - Local Authorities
- `18` - Retail Shops

**Note**: Exclude Mobile Airtime (1), Mobile Data (2), Mobile Bundles (3) for bill payments app.

---

### 3. Get Service Providers
**Endpoint**: `GET /vas/V2/ServiceProviders`

**Headers**:
- `MerchantId`: `23de4621-ea24-433f-9b45-dc1e383d8c2b`

**Query Parameters** (not shown in collection, but likely supported):
- `countryCode`: Filter by country code
- `service`: Filter by service ID

**Response**:
```json
{
    "Status": "FOUND",
    "ResultMessage": "Request processed successfully.",
    "ServiceProviders": [
        {
            "Id": "ES_ZETDC",
            "LogoURL": null,
            "Name": "ZETDC",
            "Phone": null,
            "Email": null,
            "Country": {
                "Code": "ZW",
                "Name": "Zimbabwe"
            }
        },
        {
            "Id": "ES_DSTV",
            "LogoURL": "",
            "Name": "DSTV",
            "Phone": null,
            "Email": null,
            "Country": {
                "Code": "ZW",
                "Name": "Zimbabwe"
            }
        }
        // ... more providers
    ]
}
```

**Notes**:
- `LogoURL` is often `null` or empty string
- Provider IDs are alphanumeric (e.g., `ES_ZETDC`, `DT_358`, `PN_TEST`)
- Each provider has country information

---

### 4. Get Products
**Endpoint**: `GET /vas/V2/Products`

**Headers**:
- `MerchantId`: `23de4621-ea24-433f-9b45-dc1e383d8c2b`

**Query Parameters**:
- `countryCode`: Country code (e.g., `ZW`)
- `service`: Service ID (e.g., `6` for Electricity)

**Example Request**:
```
GET /vas/V2/Products?countryCode=ZW&service=6
```

**Response**:
```json
{
    "Status": "FOUND",
    "ResultMessage": "Request processed successfully.",
    "Products": [
        {
            "Id": "BS_POWERTEL_001_ZA",
            "Aggregator": 1,
            "ImageURL": null,
            "Name": "FX Prepaid",
            "Description": "FX Prepaid Electricity",
            "ProductType": "VariableAmount",
            "TermsAndConditions": null,
            "ServiceProvider": {
                "Id": "BS_POWERTEL",
                "LogoURL": null,
                "Name": "Powertel SA",
                "Phone": null,
                "Email": null,
                "Country": {
                    "Code": "ZW",
                    "Name": "Zimbabwe"
                }
            },
            "Currency": "ZAR",
            "Price": 0,
            "MinimumAmount": 0,
            "MaximumAmount": 0,
            "SpecifyQuantity": false,
            "BalanceAvailable": false,
            "Quantity": {
                "MinimumValue": 0,
                "MaximumValue": 0,
                "Unit": ""
            },
            "ReturnsVouchers": false,
            "ReverseOnTimeout": true,
            "LastTokenAvailable": false,
            "Reversible": true,
            "Service": {
                "Id": 6,
                "Name": "Electricity"
            },
            "Validity": null,
            "PrePaymentInstructions": null,
            "PostPaymentInstructions": null,
            "MobileNumberRegex": null,
            "ValidationRequired": true,
            "CreditPartyIdentifiers": [
                {
                    "Required": true,
                    "Name": "AccountNumber",
                    "Title": "Meter Number",
                    "RegexExpression": null
                }
            ]
        }
    ]
}
```

**Key Product Fields**:

| Field | Description | Notes |
|-------|-------------|-------|
| `Id` | Product identifier | Used in ValidatePayment and PostPayment |
| `ProductType` | Always `VariableAmount` for bills | All bill products are variable amount |
| `Currency` | Currency code (USD, ZAR, ZWL, etc.) | Varies by product |
| `Price` | Always `0` for VariableAmount | User enters custom amount |
| `MinimumAmount` | Minimum payment amount | `0` means no minimum |
| `MaximumAmount` | Maximum payment amount | `0` means no maximum |
| `BalanceAvailable` | Whether balance inquiry is supported | `true`/`false` |
| `ValidationRequired` | Whether account validation is needed | `true`/`false` |
| `CreditPartyIdentifiers` | Account identifier fields | Array of required fields |
| `ReverseOnTimeout` | Whether payment can be reversed | `true`/`false` |
| `Reversible` | Whether payment is reversible | `true`/`false` |

**CreditPartyIdentifiers Structure**:
```json
{
    "Required": true,
    "Name": "AccountNumber",        // Field name for API
    "Title": "Meter Number",        // Display label for UI
    "RegexExpression": null          // Validation regex (optional)
}
```

**Common Identifier Field Names**:
- `AccountNumber` - Generic account number
- `MemberNumber` - Member/account number
- `MeterNumber` - Meter number (electricity)

**Common Titles**:
- "Meter Number"
- "Account Number"
- "Mobile Number"
- "Member Number"

---

### 5. Get Product By ID
**Endpoint**: `GET /vas/V2/Product`

**Headers**:
- `MerchantId`: `23de4621-ea24-433f-9b45-dc1e383d8c2b`

**Query Parameters**:
- `id`: Product ID (e.g., `ES_ZETDC_PREPAID_USD`)

**Example Request**:
```
GET /vas/V2/Product?id=ES_ZETDC_PREPAID_USD
```

**Response**: Same structure as Get Products (single product)

---

### 6. Validate Payment
**Endpoint**: `POST /vas/V2/ValidatePayment`

**Headers**:
- `MerchantId`: `23de4621-ea24-433f-9b45-dc1e383d8c2b`
- `Content-Type`: `application/json`

**Request Body**:
```json
{
    "RequestId": "34eb0d65-007f-4974-ac06-07e1012177b7",
    "Amount": 10.0,
    "CreditPartyIdentifiers": [
        {
            "IdentifierFieldName": "AccountNumber",
            "IdentifierFieldValue": "37242550871"
        }
    ],
    "Currency": "ZWL",
    "CustomerDetails": {
        "CustomerId": "1L",
        "Fullname": "1L",
        "MobileNumber": "+263777077921",
        "EmailAddress": null
    },
    "POSDetails": {
        "CashierId": "1L",
        "StoreId": "1L",
        "TerminalId": "1L"
    },
    "ProductId": "ES_ZETDC_PREPAID",
    "Quantity": 1
}
```

**Request Fields**:

| Field | Description | Example |
|-------|-------------|---------|
| `RequestId` | Unique request identifier (UUID) | `34eb0d65-007f-4974-ac06-07e1012177b7` |
| `Amount` | Payment amount | `10.0` |
| `CreditPartyIdentifiers` | Array of account identifiers | See structure below |
| `Currency` | Currency code | `ZWL`, `USD`, `ZAR` |
| `CustomerDetails` | Customer information | Name, phone, email |
| `POSDetails` | Point of sale details | Can use static values |
| `ProductId` | Product ID from Get Products | `ES_ZETDC_PREPAID` |
| `Quantity` | Quantity (usually `1` for bills) | `1` |

**CreditPartyIdentifiers Structure**:
```json
{
    "IdentifierFieldName": "AccountNumber",     // From product.CreditPartyIdentifiers[].Name
    "IdentifierFieldValue": "37242550871"      // User-entered account number
}
```

**Response - Success**:
```json
{
    "RequestId": "34eb0d65-007f-4974-ac06-07e1012177b7",
    "Status": "VALIDATED",
    "ResultMessage": "Validation succeeded.",
    "BillAmount": 0,
    "DisplayData": [
        {
            "Label": "Account Name",
            "Value": "MAVHUNE INNOCENT\n7205 MAKONDO EX 11M AIRDEC CHIREDZI"
        },
        {
            "Label": "Account Address",
            "Value": null
        }
    ],
    "ModelState": null
}
```

**Response - Failed (Repeatable)**:
```json
{
    "RequestId": "34eb0d65-007f-4974-ac06-07e1012177b7",
    "Status": "FAILEDREPEATABLE",
    "ResultMessage": "Duplicate transaction reference.",
    "BillAmount": 0,
    "DisplayData": null,
    "ModelState": null
}
```

**Response Status Values**:
- `VALIDATED` - Account validated successfully
- `FAILEDREPEATABLE` - Validation failed, but can retry
- Other error statuses (not shown in collection)

**DisplayData Structure**:
- `Label`: Display label (e.g., "Account Name", "Account Address", "Balance")
- `Value`: Display value (can be `null`, multi-line text, or formatted)

**Use Cases**:
- Show account information before payment
- Display outstanding balance
- Confirm account details
- Validate account number format

---

### 7. Post Payment
**Endpoint**: `POST /billpayments/v2/postpayment`

**Headers**:
- `MerchantId`: `23de4621-ea24-433f-9b45-dc1e383d8c2b`
- `Content-Type`: `application/json`

**Request Body**:
```json
{
    "RequestId": "3fa85f64-5717-0042-b3fc-2c963f66afa6",
    "PaymentChannel": "SuperApp",
    "PaymentReferenceNumber": "string",
    "ProductId": "PN_TEST_ECONET",
    "BillReferenceNumber": null,
    "Quantity": "1",
    "Currency": "USD",
    "Amount": 10.0,
    "CustomerDetails": {
        "CustomerId": "1",
        "Fullname": "Ty",
        "MobileNumber": "+26379325860",
        "EmailAddress": "string"
    },
    "CreditPartyIdentifiers": [
        {
            "IdentifierFieldName": "MemberNumber",
            "IdentifierFieldValue": "+26379325860"
        }
    ],
    "POSDetails": {
        "StoreId": "SuperApp",
        "TerminalId": "SuperApp",
        "CashierId": "SuperApp"
    }
}
```

**Request Fields**:

| Field | Description | Example |
|-------|-------------|---------|
| `RequestId` | Unique request identifier (UUID) | `3fa85f64-5717-0042-b3fc-2c963f66afa6` |
| `PaymentChannel` | Payment channel identifier | `"SuperApp"` |
| `PaymentReferenceNumber` | Reference from SuperApp payment | From SuperApp SDK response |
| `ProductId` | Product ID | `PN_TEST_ECONET` |
| `BillReferenceNumber` | Bill reference (optional) | `null` |
| `Quantity` | Quantity (string format) | `"1"` |
| `Currency` | Currency code | `USD`, `ZWL`, `ZAR` |
| `Amount` | Payment amount | `10.0` |
| `CustomerDetails` | Customer information | From SuperApp user data |
| `CreditPartyIdentifiers` | Account identifiers | Same as ValidatePayment |
| `POSDetails` | POS details | Static: `"SuperApp"` |

**Response - Success**:
```json
{
    "RequestId": "3fa83f64-5718-0042-b3fc-2c963f35afa6",
    "Status": "SUCCESSFUL",
    "ResultMessage": "Payment succeeded.",
    "ReferenceNumber": "TEST-251103120651-XP7PD",
    "DisplayData": [
        {
            "Label": "Member Number",
            "Value": "+26379325860"
        },
        {
            "Label": "Member Name",
            "Value": "Test Member"
        },
        {
            "Label": "Residence",
            "Value": "27B"
        },
        {
            "Label": "Dining Hall",
            "Value": "Msasa Hall"
        },
        {
            "Label": "Data Balance",
            "Value": "1.23GB"
        },
        {
            "Label": "Meal Credits",
            "Value": "123"
        },
        {
            "Label": "Account Balance",
            "Value": "12.34"
        },
        {
            "Label": "Info",
            "Value": "Some information the customer should see!"
        },
        {
            "Label": "Details",
            "Value": "More information the customer should see"
        }
    ],
    "Vouchers": [
        {
            "SerialNumber": "234 5678 91011",
            "VoucherCode": "DEMO 234 5678 9101112 13141516 17",
            "ValidDays": 30,
            "ExpiryDate": "2025-12-03T12:06:55.277"
        }
    ],
    "ResultInformation": null,
    "ReceiptHTML": [
        "<html>\r\n<body>\r\n<h1>Test Receipt #1 HTML</h1>\r\n<p>If present, this should be made available to the customer. Billers like ZETDC will populate the receipt HTML</p>\r\n</body>\r\n</html>",
        "<html>\r\n<body>\r\n<h1>Test Receipt #2 HTML</h1>\r\n<p>If present, this ALSO should be made available to the customer. Billers like ZETDC required that if multiple tokens are returned, a separate receipt for each should be issued to the customer</p>\r\n</body>\r\n</html>"
    ],
    "ReceiptSmses": [
        "Receipt SMS #1. If present, this must be sent via SMS to the customer",
        "Receipt SMS #2. If present, this must ALSO be sent via SMS to the customer"
    ],
    "ModelState": null
}
```

**Response - Failed (Repeatable)**:
```json
{
    "RequestId": "3fa83f64-5718-0042-b3fc-2c963f35afa6",
    "Status": "FAILEDREPEATABLE",
    "ResultMessage": "Invalid product id.",
    "ReferenceNumber": null,
    "DisplayData": null,
    "Vouchers": null,
    "ResultInformation": null,
    "ReceiptHTML": null,
    "ReceiptSmses": null,
    "ModelState": null
}
```

**Response Status Values**:
- `SUCCESSFUL` - Payment processed successfully
- `FAILEDREPEATABLE` - Payment failed, but can retry
- Other error statuses

**Response Fields**:

| Field | Description | Notes |
|-------|-------------|-------|
| `Status` | Payment status | `SUCCESSFUL`, `FAILEDREPEATABLE`, etc. |
| `ResultMessage` | Status message | Human-readable message |
| `ReferenceNumber` | Transaction reference | Store for records |
| `DisplayData` | Post-payment information | Array of Label/Value pairs |
| `Vouchers` | Voucher codes (if applicable) | Same structure as airtime |
| `ReceiptHTML` | HTML receipts array | Multiple receipts possible |
| `ReceiptSmses` | SMS receipt texts array | Multiple SMSes possible |
| `ModelState` | Validation errors (if any) | `null` on success |

**Vouchers Structure** (same as airtime):
```json
{
    "SerialNumber": "234 5678 91011",
    "VoucherCode": "DEMO 234 5678 9101112 13141516 17",
    "ValidDays": 30,
    "ExpiryDate": "2025-12-03T12:06:55.277"
}
```

**ReceiptHTML and ReceiptSmses**:
- Arrays of strings (one per token/voucher)
- Some billers (e.g., ZETDC) require separate receipts for each token
- Should be displayed/made available to customer

---

## Key Differences from Airtime API

### 1. **Base URLs**
- **Airtime Gateway**: `sandbox-dev.appletreepayments.com/vas/V2/`
- **Bill Payments Gateway**: `sandbox-dev.appletreepayments.com/vas/V2/` (same)
- **Bill Payments PostPayment**: `sandbox-apg.azurewebsites.net/billpayments/v2/` (different domain)

### 2. **Account Identification**
- **Airtime**: Phone number (single field)
- **Bill Payments**: Account identifiers (flexible structure via `CreditPartyIdentifiers`)

### 3. **Product Types**
- **Airtime**: Fixed bundles + VariableAmount
- **Bill Payments**: All products are `VariableAmount` (no fixed bundles)

### 4. **Validation Step**
- **Airtime**: No validation step (direct to payment)
- **Bill Payments**: `ValidatePayment` endpoint required before payment

### 5. **Amount Limits**
- **Airtime**: Usually has min/max limits
- **Bill Payments**: Often `0` (no limits) - user enters any amount

### 6. **Response Data**
- **Airtime**: Vouchers only
- **Bill Payments**: Vouchers + `ReceiptHTML[]` + `ReceiptSmses[]` + `DisplayData`

### 7. **Service Filtering**
- **Airtime**: Services 1, 2, 3 (Mobile Airtime, Data, Bundles)
- **Bill Payments**: Services 5, 6, 8, 9, 10, 12, 13, 17, 18 (exclude mobile services)

---

## Implementation Flow

### 1. **Bill Selection Flow**
```
Country Selection → Service Selection → Service Provider Selection → Product Selection
```

### 2. **Account Input & Validation**
```
User enters account number → ValidatePayment API → Show DisplayData → User confirms
```

### 3. **Amount Input**
```
User enters payment amount → Validate against min/max → Proceed to payment
```

### 4. **Payment Flow**
```
SuperApp Payment → PostPayment API → Show confirmation with receipts
```

### 5. **Complete Flow**
```
1. Select Country
2. Select Service (Electricity, Gas, etc.)
3. Select Service Provider (ZETDC, DSTV, etc.)
4. Select Product (if multiple products per provider)
5. Enter Account Number
6. Validate Account (ValidatePayment)
7. Show Account Info (DisplayData)
8. Enter Payment Amount
9. Process SuperApp Payment
10. Post Payment (PostPayment)
11. Show Confirmation (with ReceiptHTML, ReceiptSmses, DisplayData)
```

---

## Implementation Considerations

### 1. **Service Filtering**
- Filter services to exclude Mobile Airtime (1), Mobile Data (2), Mobile Bundles (3)
- Show only bill payment services: Internet (5), Electricity (6), Gas (8), Education (9), etc.

### 2. **Account Input Component**
- Dynamic input fields based on `CreditPartyIdentifiers` array
- Use `Title` for label (e.g., "Meter Number", "Account Number")
- Use `RegexExpression` for validation (if provided)
- Handle `Required: true` fields
- Support multiple identifier fields (if product has multiple)

### 3. **Validation Flow**
- Call `ValidatePayment` when account number is entered
- Show loading state during validation
- Display `DisplayData` in a confirmation card:
  - Account Name
  - Account Address
  - Outstanding Balance (if available)
  - Other account information
- Handle validation errors:
  - `FAILEDREPEATABLE` - Show error, allow retry
  - Other errors - Show error message
- Allow user to edit account number if validation fails

### 4. **Amount Input**
- All bill products are `VariableAmount`
- Use `MinimumAmount` and `MaximumAmount` for validation
- Handle `0` limits (no restrictions)
- Show currency from product
- Format similar to airtime custom input

### 5. **PostPayment Integration**
- Same flow as airtime:
  1. Get payment result from SuperApp SDK
  2. Call PostPayment with payment reference
  3. Handle response status
  4. Show confirmation
- Handle additional response data:
  - `ReceiptHTML[]` - Display HTML receipts (one per token)
  - `ReceiptSmses[]` - Note for SMS delivery (backend)
  - `DisplayData` - Show post-payment information

### 6. **Error Handling**
- `FAILEDREPEATABLE` - Show retry option
- `ModelState` - Show validation errors
- Network errors - Show retry option
- Timeout errors - Show retry option

### 7. **UI Components Needed**
- Service selector (grid of service categories)
- Service provider selector (list of billers)
- Product selector (if multiple products per provider)
- Account number input (dynamic based on product)
- Account validation display (DisplayData card)
- Amount input (custom amount)
- Receipt display (HTML receipts)
- Confirmation screen (with all payment details)

### 8. **Data Mapping**
- Map service IDs to service names
- Map service provider IDs to provider names
- Map product IDs to product names
- Map CreditPartyIdentifiers to input fields
- Map DisplayData to confirmation display

---

## API Response Status Values

### ValidatePayment Statuses
- `VALIDATED` - Account validated successfully
- `FAILEDREPEATABLE` - Validation failed, can retry

### PostPayment Statuses
- `SUCCESSFUL` - Payment processed successfully
- `FAILEDREPEATABLE` - Payment failed, can retry

---

## Common Field Names & Titles

### CreditPartyIdentifiers Field Names
- `AccountNumber` - Generic account number
- `MemberNumber` - Member/account number
- `MeterNumber` - Meter number

### CreditPartyIdentifiers Titles
- "Meter Number"
- "Account Number"
- "Mobile Number"
- "Member Number"

---

## Data Quality Notes

1. **Country Codes**: Some countries have duplicate codes in the response (data quality issue)
2. **LogoURL**: Often `null` or empty string - need fallback UI
3. **ImageURL**: Often `null` - need fallback UI
4. **Account Number Formats**: Vary by product - use regex validation when available
5. **Amount Limits**: Often `0` (no limits) - handle gracefully

---

## Testing Recommendations

1. **Test with different products**:
   - Electricity (ZETDC)
   - DSTV
   - Education (NUST, CUT)
   - Local Authorities (HARARE, GWERU)

2. **Test validation scenarios**:
   - Valid account number
   - Invalid account number
   - Duplicate transaction reference
   - Network errors

3. **Test payment scenarios**:
   - Successful payment
   - Failed repeatable payment
   - Products with receipts
   - Products with vouchers
   - Products with DisplayData

4. **Test edge cases**:
   - Products with no min/max limits
   - Products with validation required = false
   - Products with multiple CreditPartyIdentifiers
   - Products with BalanceAvailable = true

---

## Next Steps

1. Create AppleTree service wrapper (similar to airtime)
2. Implement service filtering logic
3. Build account input component with dynamic fields
4. Implement ValidatePayment flow
5. Update PaymentFlowManager for bill payments
6. Handle PostPayment response with receipts
7. Create confirmation screen with receipts display
8. Test with various billers and products

---

## References

- Postman Collection: `H5 Bill Payments.postman_collection.json`
- Airtime App Reference: `../04-h5-airtime/`
- AppleTree Gateway API Base: `https://sandbox-dev.appletreepayments.com/vas/V2/`
- PostPayment API Base: `https://sandbox-apg.azurewebsites.net/billpayments/v2/`

