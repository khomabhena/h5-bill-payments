# H5 Bill Payments Mini-App

A React-based mini-app for bill payments, integrated with the SuperApp SDK and AppleTree Gateway API. This application allows users to pay bills (electricity, water, TV subscriptions, etc.) across multiple countries.

## Features

- **Multi-Country Support**: Select from 35+ countries
- **Multiple Services**: Support for electricity, water, gas, TV subscriptions, education, insurance, and more
- **Account Validation**: Real-time account validation before payment
- **Secure Payments**: Integrated with SuperApp SDK for secure payment processing
- **AppleTree Gateway**: Full integration with AppleTree Gateway API for bill payment services

## Tech Stack

- **React** - UI framework
- **React Router** - Navigation
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **SuperApp SDK** - Payment processing
- **AppleTree Gateway API** - Bill payment services

## Project Structure

```
06-h5-bill-payments/
├── src/
│   ├── pages/              # Page components
│   │   ├── CountryServiceSelection.jsx
│   │   ├── ProviderSelection.jsx
│   │   ├── ProductSelection.jsx
│   │   ├── AccountInput.jsx
│   │   ├── Payment.jsx
│   │   └── Confirmation.jsx
│   ├── components/          # Reusable components
│   │   ├── Header.jsx
│   │   ├── Button.jsx
│   │   ├── CountryInputField.jsx
│   │   └── buttons/
│   │       └── ReusableButton.jsx
│   ├── data/               # Static data
│   │   ├── colors.js
│   │   └── countries.js
│   ├── hooks/              # Custom hooks
│   │   └── useUserAuth.js
│   └── services/           # Service utilities
├── h5-automation-api/      # API integration layer
│   ├── appletree/          # AppleTree Gateway API
│   │   ├── AppleTreeGateway.js
│   │   └── appleTreeService.js
│   └── superapp/           # SuperApp SDK integration
│       ├── BillPaymentFlowManager.js
│       ├── SuperAppPayment.js
│       ├── statusService.js
│       └── UserService.js
└── public/
    └── superapp/           # SuperApp SDK files
        ├── js-sdk.js
        └── mock-bridge.js
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 06-h5-bill-payments
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage Flow

1. **Country & Service Selection**: Select a country and service type
2. **Provider Selection**: Choose a service provider
3. **Product Selection**: Select a specific product/plan
4. **Account Input**: Enter account details and payment amount (with validation)
5. **Payment**: Review order summary and complete payment
6. **Confirmation**: View payment confirmation and transaction details

## API Integration

### AppleTree Gateway

The app integrates with AppleTree Gateway API for:
- Country and service listings
- Service provider information
- Product catalogs
- Account validation
- Payment processing

### SuperApp SDK

Payment processing is handled through the SuperApp SDK:
- User authentication
- Payment cashier integration
- Payment status checking
- Transaction management

## Configuration

### AppleTree Gateway

Default configuration is set in `h5-automation-api/appletree/AppleTreeGateway.js`:
- Merchant ID: `23de4621-ea24-433f-9b45-dc1e383d8c2b`
- Base URL: `https://sandbox-dev.appletreepayments.com`
- API Version: `V2`

### SuperApp SDK

Configuration is set in `h5-automation-api/superapp/SuperAppPayment.js`:
- Merchant ID: `MG3518zo1Wd0XlXZzn`
- App ID: `AX35182510130000001000103500`
- Base URL: `https://appleseed-uat-api.joypaydev.com`

## Development

### Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Code Structure

- **Pages**: Each screen in the payment flow is a separate page component
- **Components**: Reusable UI components following the design system
- **API Layer**: Separated into `h5-automation-api` for better organization
- **State Management**: Uses React hooks and location state for navigation

## Design System

The app follows a consistent design system defined in `src/data/colors.js`:
- Primary color: `#CEFF80` (lime green)
- Background: Gradient from green-50 to emerald-50
- Text colors: Dark gray scale
- Consistent spacing and typography

## Notes

- The app is designed for mobile-first usage within a SuperApp environment
- Payment fulfillment (PostPayment) is currently disabled and will be implemented later
- Account validation runs automatically 1 second after the user stops typing
- The app supports both fixed and variable payment amounts

## License

See LICENSE file for details.

