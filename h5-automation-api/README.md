# H5 Automation API

This folder contains integration code for external APIs used by the bill payments mini app.

## Structure

### `/appletree/`
AppleTree Gateway API integration for bill payments:
- `appleTreeService.js` - Main service for API calls
- `index.js` - Module exports

### `/superapp/`
SuperApp SDK integration (located in `public/superapp/`):
- `js-sdk.js` - SuperApp JavaScript SDK
- `mock-bridge.js` - Mock bridge for browser testing (development only)

## Usage

### AppleTree API
```javascript
import { getCountries, getServices } from '../h5-automation-api/appletree';
```

### SuperApp SDK
The SuperApp SDK is loaded via script tags in `index.html` and creates `window.payment` object.

