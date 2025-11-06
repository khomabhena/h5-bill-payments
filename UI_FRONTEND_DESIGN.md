# Bill Payments Mini App - UI/Front-End Design Documentation

## Overview

This document outlines the UI/UX design, component structure, and front-end implementation guidelines for the Bill Payments mini app. The design follows the same patterns, colors, layout, and styling as the Airtime app to maintain consistency across the superapp ecosystem.

---

## Design System

### Color Palette
**Source**: `src/data/colors.js` (same as airtime app)

The app uses a green/emerald color scheme with consistent branding:

```javascript
{
  app: {
    primary: '#...',        // Primary green color
    primaryDark: '#...',     // Darker green for emphasis
    primaryDarker: '#...'   // Darkest green
  },
  background: {
    primary: '#...',         // Main background
    secondary: '#...'       // Secondary background
  },
  text: {
    primary: '#...',         // Primary text color
    secondary: '#...',       // Secondary text color
    button: '#...',         // Button text color
    inverse: '#...'         // Inverse text (white)
  },
  border: {
    primary: '#...',         // Primary border color
    secondary: '#...',       // Secondary border color
    brand: '#...'           // Brand border color
  },
  state: {
    success: '#...',         // Success state color
    successLight: '#...',   // Light success background
    warning: '#...',        // Warning state color
    error: '#...'          // Error state color
  }
}
```

### Layout Structure

**PageWrapper Component**:
- Full-screen gradient background: `from-green-50 to-emerald-50`
- Max width: `max-w-4xl`
- Centered: `mx-auto`
- Minimum height: `min-h-screen`

**Header Component**:
- Background: White
- Padding: `px-3 pt-14 pb-4`
- Back button: Circular, gray with hover state
- Title: `text-base font-semibold text-gray-800`
- Centered layout with spacer div

**Content Container**:
- Background: White
- Padding: `px-6 pb-6`
- Flex layout: `flex flex-col`
- Full width: `w-full`
- Flex grow: `flex-1`

**Button Container**:
- Padding: `p-6 pb-12` or `p-6 pb-24`
- Fixed at bottom (when needed)

---

## Component Structure

### Core Components

#### 1. **PageWrapper**
**Purpose**: Wraps all pages with consistent layout and gradient background

**Props**:
- `children`: React children
- `className`: Additional CSS classes (optional)

**Usage**:
```jsx
<PageWrapper>
  {/* Page content */}
</PageWrapper>
```

**Styling**:
- Background: Gradient from green-50 to emerald-50
- Min height: Full screen
- Max width: 4xl (centered)

---

#### 2. **Header**
**Purpose**: Page header with back button and title

**Props**:
- `title`: Header title text
- `onBack`: Custom back handler (optional)
- `showBackButton`: Boolean (default: true)
- `className`: Additional CSS classes (optional)

**Usage**:
```jsx
<Header 
  title="Bill Payments" 
  showBackButton={true}
  onBack={handleBack}
/>
```

**Styling**:
- White background
- Back button: Circular, gray with hover
- Title: Semibold, gray-800

---

#### 3. **Button**
**Purpose**: Primary action button with loading states

**Props**:
- `children`: Button text/content
- `onClick`: Click handler
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `disabled`: Boolean (default: false)
- `loading`: Boolean (default: false)
- `className`: Additional CSS classes (optional)

**Usage**:
```jsx
<Button
  onClick={handleContinue}
  disabled={!isValid}
  loading={isLoading}
  className="w-full"
>
  Continue
</Button>
```

**Styling**:
- Primary: Green background, black text, shadow
- Disabled: Light gray background, reduced opacity
- Loading: Spinner icon with "Loading..." text

---

#### 4. **InputField**
**Purpose**: Form input with label, error, and icon support

**Props**:
- `type`: Input type (text, tel, number, etc.)
- `label`: Input label
- `value`: Input value
- `onChange`: Change handler
- `placeholder`: Placeholder text
- `error`: Error message (optional)
- `loading`: Loading state (optional)
- `customColors`: Color scheme object
- `icon`: Left icon (optional)
- `rightIcon`: Right icon (optional)
- `showCountryMap`: Show country flag/map (optional)
- `countryData`: Country data object (optional)

**Usage**:
```jsx
<InputField
  type="text"
  label="Account Number"
  value={accountNumber}
  onChange={handleChange}
  placeholder="Enter account number"
  error={error}
  loading={isValidating}
  customColors={colors}
  icon={<AccountIcon />}
/>
```

**Styling**:
- White background
- Border: Gray-200
- Rounded corners: `rounded-lg`
- Focus: Border color change
- Error: Red border and text

---

#### 5. **ReusableButton**
**Purpose**: Selection button for categories, services, providers

**Props**:
- `onClick`: Click handler
- `selected`: Boolean (selected state)
- `variant`: 'selection' | 'card' (default: 'selection')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `customColors`: Color scheme object
- `icon`: Icon component (optional)
- `title`: Card title (for card variant)
- `price`: Price value (for card variant)
- `currency`: Currency code (for card variant)
- `description`: Description text (for card variant)
- `className`: Additional CSS classes (optional)

**Usage - Selection**:
```jsx
<ReusableButton
  onClick={() => setService('electricity')}
  selected={service === 'electricity'}
  variant="selection"
  customColors={colors}
  icon={<ElectricityIcon />}
>
  Electricity
</ReusableButton>
```

**Usage - Card**:
```jsx
<ReusableButton
  onClick={() => selectProduct(product)}
  selected={selectedProduct?.id === product.id}
  variant="card"
  customColors={colors}
  title={product.name}
  price={product.price}
  currency={product.currency}
  description={product.description}
/>
```

**Styling**:
- Selection: Toggle button with border
- Selected: Green background, white text
- Card: Card-style with shadow
- Hover: Shadow increase, slight lift

---

## Screen-by-Screen Breakdown

### Screen 1: Country & Service Selection
**Route**: `/` or `/services`

**Purpose**: Select country and bill payment service category together

**Components**:
- Header: "Select Country & Service" (with close button on first screen)
- Country selector (top section)
- Service selector (bottom section)
- Each country card shows: Flag emoji, Country name
- Each service card shows: Service icon, Service name (Electricity, Gas, DSTV, etc.)

**Layout**:
- Country section: 
  - Title: "Select Country" (small text, `text-xs text-gray-600`)
  - Grid: `grid-cols-2 sm:grid-cols-3 gap-3`
  - Cards: ReusableButton with selection variant
- Service section:
  - Title: "Select Service" (small text, `text-xs text-gray-600`)
  - Grid: `grid-cols-2 gap-3`
  - Cards: ReusableButton with selection variant
- Continue button: Fixed at bottom (disabled until both selected)

**Services** (from API):
- Internet Broadband (Service ID: 5)
- Electricity (Service ID: 6)
- Gas (Service ID: 8)
- Education (Service ID: 9)
- Insurance (Service ID: 10)
- Phone (Service ID: 12)
- Television (Service ID: 13)
- Local Authorities (Service ID: 17)
- Retail Shops (Service ID: 18)

**State**:
- `selectedCountry`: Country object (null initially)
- `selectedService`: Service object with Id and Name (null initially)

**Interaction**:
- User can select country first, then service
- User can select service first, then country
- Both selections are independent
- Continue button enabled only when both are selected

**Layout Details**:
- Two-section layout on mobile
- Country section: Top section with title and country grid
- Service section: Bottom section with title and service grid
- Spacing: `mb-6` between sections
- Scrollable if content exceeds screen height
- Continue button: Fixed at bottom, full width, disabled until both selected

**Visual Layout**:
```
┌─────────────────────────────────┐
│ Header: "Select Country & Service" │
├─────────────────────────────────┤
│                                 │
│  Select Country                │
│  ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ 🇿🇼 │ │ 🇿🇦 │ │ 🇳🇬 │      │
│  │ ZW  │ │ ZA  │ │ NG  │      │
│  └─────┘ └─────┘ └─────┘      │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Select Service                 │
│  ┌─────┐ ┌─────┐               │
│  │ ⚡  │ │ 🔥  │               │
│  │Elec │ │ Gas │               │
│  └─────┘ └─────┘               │
│  ┌─────┐ ┌─────┐               │
│  │ 📺 │ │ 🎓  │               │
│  │DSTV │ │Edu  │               │
│  └─────┘ └─────┘               │
│                                 │
├─────────────────────────────────┤
│ [Continue] (disabled)           │
└─────────────────────────────────┘
```

**Data Sources**:
- **Countries**: Use `carriers.js` from airtime app (`getAllCountries()`) - Contains country codes, names, and flag emojis
- **Services**: API call `getServices()` - Filter to exclude Mobile services (1, 2, 3)

**Note**: The `carriers.js` file already has country data with flags (e.g., `{ countryCode: "ZW", countryName: "Zimbabwe", flag: "🇿🇼" }`), which can be reused for the country selection grid. We can either:
1. Import directly from airtime app's `carriers.js`
2. Create a similar `countries.js` file in bill payments app
3. Use API countries but map flags from `carriers.js`

**Navigation**:
- On both selected → Navigate to `/providers`

---

### Screen 2: Service Provider Selection
**Route**: `/providers`

**Purpose**: Select biller/service provider

**Components**:
- Header: "Select Provider" with back button
- Country & Service info display (selected country flag, service name/icon)
- List/Grid of provider cards
- Each card shows: Provider logo (or fallback), Provider name

**Layout**:
- Country & Service info: Centered, with country flag and service icon
- Providers: Grid `grid-cols-2 sm:grid-cols-3 gap-3`
- Cards: ReusableButton with card variant

**State**:
- `selectedProvider`: Provider object with Id, Name, LogoURL

**Loading State**:
- Spinner with "Loading providers..." message

**Error State**:
- Red error card with message

**Navigation**:
- On select → Navigate to `/products`

**API Call**:
- `getServiceProviders({ countryCode, serviceId })`

---

### Screen 3: Product Selection
**Route**: `/products`

**Purpose**: Select specific product (if multiple products per provider)

**Components**:
- Header: "Select Product"
- Provider info display (name, logo)
- List of product cards (if multiple products)
- Or skip if only one product

**Layout**:
- Provider info: Centered, with logo
- Products: Grid `grid-cols-1 sm:grid-cols-2 gap-3`
- Cards: ReusableButton with card variant

**State**:
- `selectedProduct`: Product object

**Navigation**:
- If single product → Auto-select and navigate to `/account`
- If multiple products → User selects, then navigate to `/account`

**API Call**:
- `getProducts({ countryCode, service, serviceProviderId })`

**Note**: If only one product, auto-select and proceed.

---

### Screen 4: Account Number Input
**Route**: `/account`

**Purpose**: Enter account number and validate

**Components**:
- Header: "Enter Account Number" with back button
- Product info display (name, provider)
- Account number input field
- Dynamic label based on `CreditPartyIdentifiers[].Title`
- Validation status indicator
- Continue button (disabled until validated)

**Layout**:
- Product info: Centered card with provider logo
- Input: Full-width InputField
- Validation status: Below input (loading spinner or checkmark)

**State**:
- `accountNumber`: String
- `isValidating`: Boolean
- `validationResult`: Object (null | validated data)
- `validationError`: String (null | error message)

**Input Field**:
- Label: Dynamic from `CreditPartyIdentifiers[].Title` (e.g., "Meter Number", "Account Number")
- Placeholder: "Enter [field name]"
- Type: `text` (or `tel` if field name suggests phone)
- Validation: Use `RegexExpression` from `CreditPartyIdentifiers` if available

**Validation Flow**:
1. User enters account number
2. Debounce (500ms)
3. Call `ValidatePayment` API
4. Show loading spinner
5. On success: Show validation result (DisplayData)
6. On error: Show error message
7. Enable Continue button when validated

**Validation Result Display**:
- Card showing `DisplayData`:
  - Account Name
  - Account Address
  - Outstanding Balance (if available)
  - Other account information

**API Call**:
- `validatePayment({ ProductId, CreditPartyIdentifiers, Amount, Currency, ... })`

**Navigation**:
- On validation success → Navigate to `/amount`

---

### Screen 5: Amount Input
**Route**: `/amount`

**Purpose**: Enter payment amount

**Components**:
- Header: "Enter Amount" with back button
- Account info display (validated account details)
- Amount input field
- Min/Max limits display (if available)
- Currency display
- Continue button

**Layout**:
- Account info: Card with DisplayData
- Amount input: Large, prominent InputField
- Limits: Small text below input
- Currency: Displayed next to input

**State**:
- `amount`: Number
- `currency`: String (from product)
- `minAmount`: Number (from product.MinimumAmount)
- `maxAmount`: Number (from product.MaximumAmount)

**Amount Input**:
- Type: `number`
- Label: "Payment Amount"
- Placeholder: "Enter amount"
- Min: `minAmount` (if > 0)
- Max: `maxAmount` (if > 0)
- Step: 0.01 (for decimal amounts)
- Format: Show currency code

**Validation**:
- Check against min/max limits
- Show error if out of range
- Handle `0` limits (no restrictions)

**Currency Display**:
- Format: "USD", "ZAR", "ZWL", etc.
- Show next to input or as prefix

**Layout**:
- Account summary card (read-only)
- Amount input (large, prominent)
- Limits text (if applicable)
- Continue button

**Navigation**:
- On valid amount → Navigate to `/payment`

---

### Screen 6: Payment Confirmation
**Route**: `/payment`

**Purpose**: Review order and process payment

**Components**:
- Header: "Complete Payment" with back button
- Order summary card:
  - Provider name
  - Product name
  - Account number
  - Account name (from validation)
  - Amount
  - Currency
  - Total
- Security notice
- Pay button (fixed at bottom)

**Layout**:
- Order summary: White card with border, shadow
- Security notice: Info card with lock icon
- Pay button: Fixed at bottom, full width

**State**:
- `isProcessing`: Boolean
- `error`: String (null | error message)

**Order Summary Fields**:
- Provider: `selectedProvider.Name`
- Product: `selectedProduct.Name`
- Account Number: `accountNumber`
- Account Name: From `validationResult.DisplayData`
- Amount: `amount` formatted with currency
- Total: Same as amount (for bills)

**Payment Flow**:
1. User clicks "Pay [Amount]"
2. Set `isProcessing = true`
3. Show "Processing..." on button
4. Call SuperApp Payment SDK
5. On payment success → Call PostPayment API
6. Navigate to `/confirmation` with payment data

**Error Handling**:
- Show error card if payment fails
- Allow retry
- Show specific error message

**API Calls**:
- SuperApp SDK: `window.payment.payOrder()`
- PostPayment: `POST /billpayments/v2/postpayment`

**Navigation**:
- On payment success → Navigate to `/confirmation`

---

### Screen 7: Confirmation
**Route**: `/confirmation`

**Purpose**: Show payment success and receipt

**Components**:
- Header: "Payment Successful" (no back button)
- Success icon (checkmark in green circle)
- Success message: "Payment Successful!"
- Transaction details card:
  - Transaction ID
  - Reference Number (from PostPayment)
  - Provider name
  - Product name
  - Account number
  - Account name
  - Amount paid
  - Payment method
  - Date
- Delivery status card:
  - Status (SUCCESSFUL, FAILEDREPEATABLE, etc.)
  - Message
  - Reference number
- Receipt HTML display (if available):
  - One receipt per token
  - Display in iframe or formatted HTML
- Vouchers display (if available):
  - Serial Number (copyable)
  - Voucher Code (copyable)
  - Valid Days
  - Expiry Date
- DisplayData card (post-payment info):
  - Account balance
  - Updated account info
  - Other post-payment data
- Done button

**Layout**:
- Success header: Centered, large checkmark
- Transaction details: White card with border
- Delivery status: Colored card (green for success, yellow for retry, orange for incomplete)
- Receipts: Scrollable container with receipt cards
- Vouchers: Card list (similar to airtime)
- DisplayData: Info card with key-value pairs

**State**:
- `paymentData`: Payment result object
- `postPaymentResult`: PostPayment API response
- `copiedField`: Track copied fields (for copy buttons)

**Receipt Display**:
- If `ReceiptHTML` array exists:
  - Display each receipt in a card
  - Use iframe or formatted HTML
  - Show receipt number (1 of N, 2 of N, etc.)

**Voucher Display**:
- Same structure as airtime app
- Copy buttons for Serial Number and Voucher Code
- Expiry date with warning if < 7 days

**DisplayData Display**:
- Key-value pairs from `postPaymentResult.DisplayData`
- Format: Label on left, Value on right
- Handle multi-line values (e.g., account address)

**Navigation**:
- Done button → Close mini app (`window.payment.close()`)

---

## Component Specifications

### Country Card Component
**Purpose**: Display country with flag

**Props**:
- `country`: Country object { countryCode, countryName, flag } (from carriers.js)
- `selected`: Boolean
- `onClick`: Click handler

**Design**:
- Flag: Country flag emoji (from `country.flag` - e.g., "🇿🇼")
- Name: Country name (from `country.countryName`)
- Code: Country code (from `country.countryCode`) - optional display
- Selected: Green background, white text
- Layout: Selection button variant

**Data Source**:
- Use `getAllCountries()` from `carriers.js` (airtime app)
- Structure: `{ countryCode: "ZW", countryName: "Zimbabwe", flag: "🇿🇼", callingCode: "+263" }`

---

### Service Card Component
**Purpose**: Display service category with icon

**Props**:
- `service`: Service object { Id, Name }
- `selected`: Boolean
- `onClick`: Click handler

**Design**:
- Icon based on service type:
  - Electricity: ⚡
  - Gas: 🔥
  - DSTV: 📺
  - Education: 🎓
  - Internet: 🌐
- Name: Service name
- Selected: Green background, white text

---

### Provider Card Component
**Purpose**: Display service provider/biller

**Props**:
- `provider`: Provider object { Id, Name, LogoURL, Country }
- `selected`: Boolean
- `onClick`: Click handler

**Design**:
- Logo: Provider logo (or fallback with initials)
- Name: Provider name
- Selected: Green border, background tint

**Fallback Logo**:
- If `LogoURL` is null/empty:
  - Show colored circle with provider initials
  - Use provider name first 2 letters
  - Use brand color or random color

---

### Product Card Component
**Purpose**: Display product (if multiple products per provider)

**Props**:
- `product`: Product object
- `selected`: Boolean
- `onClick`: Click handler

**Design**:
- Name: Product name
- Description: Product description
- Currency: Product currency
- Selected: Green border, background tint

---

### Account Validation Card Component
**Purpose**: Display validated account information

**Props**:
- `displayData`: Array of { Label, Value }
- `accountNumber`: Account number string

**Design**:
- White card with border
- Key-value pairs:
  - Label: Gray text, left-aligned
  - Value: Black text, right-aligned
- Handle multi-line values (e.g., address)
- Show account number at top

**Layout**:
- Account number: Large, prominent
- DisplayData: Grid or list of key-value pairs

---

### Amount Input Component
**Purpose**: Custom amount input with currency

**Props**:
- `value`: Amount value
- `onChange`: Change handler
- `currency`: Currency code
- `minAmount`: Minimum amount (optional)
- `maxAmount`: Maximum amount (optional)
- `error`: Error message (optional)

**Design**:
- Large input field
- Currency prefix or suffix
- Min/max limits displayed below
- Validation feedback

---

### Receipt Display Component
**Purpose**: Display HTML receipts from PostPayment

**Props**:
- `receipts`: Array of HTML strings
- `referenceNumber`: Reference number

**Design**:
- Card for each receipt
- Receipt number (1 of N, 2 of N)
- HTML rendered in iframe or formatted div
- Scrollable if content is long

**Layout**:
- If multiple receipts: Stacked cards
- Each receipt: Card with receipt HTML
- Receipt header: "Receipt #1", "Receipt #2", etc.

---

## Responsive Design

### Mobile-First Approach
- All layouts optimized for mobile
- Touch-friendly: Minimum 44px touch targets
- Spacing: Comfortable padding for thumb navigation

### Breakpoints
- Mobile: Default (< 640px)
- Tablet: `sm:` (≥ 640px)
- Desktop: `lg:` (≥ 1024px)

### Grid Layouts
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns (where applicable)

### Typography
- Headings: `text-base` to `text-lg`
- Body: `text-sm` to `text-base`
- Labels: `text-xs` to `text-sm`
- Buttons: `text-base` to `text-lg`

---

## State Management

### Global State (App Level)
- `selectedCountry`: Country object
- `selectedService`: Service object
- `selectedProvider`: Provider object
- `selectedProduct`: Product object
- `accountNumber`: String
- `validationResult`: Validation response
- `amount`: Number
- `paymentData`: Payment result
- `postPaymentResult`: PostPayment response

### Local State (Component Level)
- Loading states
- Error states
- UI interactions (modals, dropdowns)
- Form validation

---

## Navigation Flow

```
1. / (Country & Service Selection)
   ↓
2. /providers
   ↓
3. /products (if multiple products, else auto-skip)
   ↓
4. /account
   ↓ (validate account)
5. /amount
   ↓
6. /payment
   ↓ (process payment)
7. /confirmation
   ↓
8. Close app (Done button)
```

**Back Navigation**:
- All screens have back button (except confirmation)
- Back button navigates to previous screen
- Back button on first screen closes app

---

## Loading States

### API Loading Indicators
- Spinner icon with "Loading..." text
- Position: Center of content area
- Color: Blue-500 or primary color

### Button Loading States
- Spinner replaces button text
- Button disabled during loading
- Text: "Processing..." or "Loading..."

### Full-Page Loading
- Overlay with spinner
- Message: "Loading [resource]..."
- Examples: "Loading providers...", "Loading products..."

---

## Error States

### Error Display
- Red card with error icon
- Error message in red text
- Retry button (if applicable)

### Error Types
1. **Network Error**: "Network error. Please check your connection."
2. **Validation Error**: Show specific validation message
3. **API Error**: Show API error message
4. **Payment Error**: Show payment error message

### Error Handling
- Show error card above content
- Allow retry (if applicable)
- Dismiss error option
- Clear error on retry

---

## Success States

### Success Indicators
- Green checkmark icon
- Success message
- Success color (green)

### Success Display Locations
1. Account validation: Green checkmark next to input
2. Payment confirmation: Large checkmark, success message
3. Copy actions: Checkmark replaces copy icon

---

## Accessibility

### Touch Targets
- Minimum 44px height/width
- Comfortable spacing between buttons

### Focus States
- Visible focus indicators
- Keyboard navigation support

### Screen Reader Support
- Semantic HTML
- ARIA labels where needed
- Alt text for icons

### Color Contrast
- Text meets WCAG AA standards
- Sufficient contrast ratios

---

## Animation & Transitions

### Transitions
- Button hover: Shadow increase, slight lift
- Card hover: Shadow increase
- Input focus: Border color change
- Page transitions: Smooth fade (if router supports)

### Loading Animations
- Spinner: Rotating animation
- Skeleton loaders: Shimmer effect (optional)

---

## Mobile Optimizations

### Touch Interactions
- `touch-action: manipulation` (prevents double-tap zoom)
- Large touch targets (44px minimum)
- Swipe gestures (optional, for back navigation)

### Viewport
- `user-scalable=no` (prevents zooming)
- `maximum-scale=1.0`
- Fixed viewport width

### Input Handling
- Appropriate input types (tel, email, number)
- Input formatting (as user types)
- Auto-capitalization off where appropriate

---

## Integration Points

### SuperApp SDK
- `window.payment.setHeader()` - Hide/show header
- `window.payment.close()` - Close mini app
- `window.payment.payOrder()` - Process payment
- `window.payment.getAuthToken()` - Get auth token
- `window.payment.getUserInfo()` - Get user info

### AppleTree Gateway API
- Service discovery endpoints
- Account validation
- PostPayment processing

---

## File Structure

```
src/
├── components/
│   ├── Header.jsx
│   ├── Button.jsx
│   ├── PageWrapper.jsx
│   ├── InputField.jsx
│   ├── ReusableButton.jsx
│   ├── ServiceCard.jsx
│   ├── ProviderCard.jsx
│   ├── ProductCard.jsx
│   ├── AccountValidationCard.jsx
│   ├── AmountInput.jsx
│   ├── ReceiptDisplay.jsx
│   └── buttons/
│       ├── BaseButton.jsx
│       ├── CardButton.jsx
│       ├── SelectionButton.jsx
│       └── ReusableButton.jsx
├── pages/
│   ├── CountryServiceSelection.jsx
│   ├── ProviderSelection.jsx
│   ├── ProductSelection.jsx
│   ├── AccountInput.jsx
│   ├── AmountInput.jsx
│   ├── Payment.jsx
│   └── Confirmation.jsx
├── services/
│   └── appleTreeService.js
├── hooks/
│   ├── useAccountValidation.js
│   └── useUserAuth.js
├── utils/
│   └── uiUtils.jsx
├── data/
│   ├── colors.js
│   ├── constants.js
│   └── countries.js (or reuse carriers.js from airtime app)
├── App.jsx
└── main.jsx
```

---

## Component Reusability

### Shared Components
- **Header**: Used on all screens
- **Button**: Primary action button
- **PageWrapper**: Wraps all pages
- **InputField**: All text inputs
- **ReusableButton**: Selection and card buttons

### Specialized Components
- **ServiceCard**: Service selection
- **ProviderCard**: Provider selection
- **AccountValidationCard**: Account info display
- **ReceiptDisplay**: Receipt HTML rendering

---

## Design Consistency Checklist

- [ ] Same color scheme as airtime app
- [ ] Same layout structure (PageWrapper, Header, Content)
- [ ] Same button styles and variants
- [ ] Same input field styles
- [ ] Same card styles and shadows
- [ ] Same spacing and padding
- [ ] Same typography scale
- [ ] Same loading states
- [ ] Same error states
- [ ] Same success states
- [ ] Same mobile-first approach
- [ ] Same touch optimizations

---

## Next Steps

1. Create component library (reuse from airtime)
2. Set up routing structure
3. Implement screen-by-screen
4. Integrate AppleTree API calls
5. Add loading and error states
6. Test responsive design
7. Test touch interactions
8. Validate accessibility
9. Test with real API responses
10. Polish animations and transitions

---

## References

- Airtime App: `../04-h5-airtime/`
- Color Scheme: `src/data/colors.js`
- AppleTree API: `APPLE_TREE_GATEWAY_API_ANALYSIS.md`
- React Router: `react-router-dom`
- Tailwind CSS: `tailwindcss`

