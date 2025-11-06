// ### 🧩 Description
// After sending the payment, the next step is to **verify the transaction status** using the **Payment Result Query** endpoint.  
// This ensures that the payment has been successfully processed or identifies any issues that occurred during processing.

// The status check is done by querying the **business ID (`bizId`)** or **order number** associated with the transaction.

// ---

// ### 🔸 Endpoint
// **Endpoint:** `Payment Result Query`  
// **Request File:** `statusService.js`

// ---

// ### 📤 Request Parameters
// | Parameter | Description |
// |------------|--------------|
// | `bizId` | The unique business transaction identifier. |


// import { queryPaymentStatus } from './statusService.js';

// const response = await queryPaymentStatus({
//     bizId: 'BIZ202510210001',
//     orderId: '857112240108010000000000461000'
// });

// console.log(response);


//query payment status 
// Using built-in fetch API (available in modern browsers and React)

// Order status constants
export const ORDER_STATUS = {
  SUCCESS: 'SUCCESS',     // Pay or Refund success
  PROCESSING: 'PROCESSING', // Pay or Refund processing
  CLOSED: 'CLOSED',       // Closed
  FAIL: 'FAIL'            // Pay or Refund failed
};

export default class StatusService {
  constructor(baseUrl = "https://appleseed-uat-api.joypaydev.com/v1/pay/transaction/result") {
    this.baseUrl = baseUrl;
  }

  async checkStatus(body, authorizationHeader) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authorizationHeader,
        },
        body: body,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Payment status check failed: HTTP ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('StatusService error:', error);
      throw error;
    }
  }

  // Query payment status with proper parameter validation
  async queryPaymentStatus({ bizId, orderId }, authToken) {
    if (!bizId) {
      throw new Error('bizId is required for payment status query');
    }

    const body = JSON.stringify({ 
      bizId,
      ...(orderId && { orderId })
    });

    const authorizationHeader = authToken.startsWith('Bearer') ? authToken : `Bearer ${authToken}`;
    
    return await this.checkStatus(body, authorizationHeader);
  }
}

// Convenience function for easy import
export const queryPaymentStatus = async ({ bizId, orderId }, authToken) => {
  const statusService = new StatusService();
  return await statusService.queryPaymentStatus({ bizId, orderId }, authToken);
};

