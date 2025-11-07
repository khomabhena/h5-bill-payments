/**
 * Example: Complete Bill Payment Flow with Status Checking
 * 
 * This example demonstrates how to use the integrated SuperApp payment
 * for bill payments (electricity, water, etc.) with automatic status checking.
 */

import { BillPaymentFlowManager, ORDER_STATUS } from './index.js';

// Example usage
async function processBillPayment() {
  try {
    // Initialize Bill Payment Flow Manager with logging
    const flowManager = new BillPaymentFlowManager((type, message, data) => {
      console.log(`[${type.toUpperCase()}] ${message}`, data || '');
    });

    // Prepare payment data
    const paymentData = {
      country: {
        countryCode: 'ZW',
        countryName: 'Zimbabwe'
      },
      service: {
        Id: '6',
        Name: 'Electricity'
      },
      provider: {
        Id: 'PRV_ZETDC',
        Name: 'ZETDC'
      },
      product: {
        Id: 'PN_TEST_ZETDC',
        Name: 'ZETDC Prepaid Electricity',
        Currency: 'USD',
        MinimumAmount: 0,
        MaximumAmount: 0,
        VariableAmount: true,
        CreditPartyIdentifiers: [
          {
            Name: 'MeterNumber',
            Title: 'Meter Number',
            Required: true
          }
        ]
      },
      accountValue: '1234567890',
      amount: 10.00,
      validationData: {
        Status: 'VALIDATED',
        DisplayData: [
          { Label: 'Account Name', Value: 'John Doe' },
          { Label: 'Outstanding Balance', Value: '50.00' }
        ]
      }
    };

    console.log('🚀 Starting bill payment process...');
    console.log('📋 Payment Details:', paymentData);

    // Process payment with automatic status checking
    const result = await flowManager.executePayment(paymentData, {
      postToAppleTree: false, // Set to true to enable PostPayment API
      userInfo: null // Optional: pass userInfo if available
    });

    if (result.success) {
      console.log('✅ Payment processed successfully!');
      console.log('💳 Transaction ID:', result.transactionId);
      console.log('🆔 Prepay ID:', result.prepayId);
      console.log('📊 Payment Status:', result.paymentStatus);
      console.log('🏪 Cashier Result:', result.cashierResult);
      console.log('📈 Status Result:', result.statusResult);

      // Handle different status outcomes
      switch (result.paymentStatus) {
        case ORDER_STATUS.SUCCESS:
          console.log('🎉 Payment completed successfully!');
          // Proceed to show confirmation or call PostPayment
          break;
          
        case ORDER_STATUS.PROCESSING:
          console.log('⏳ Payment is still processing...');
          // Show processing message to user
          break;
          
        case ORDER_STATUS.CLOSED:
          console.log('❌ Payment was closed/cancelled');
          // Handle cancelled payment
          break;
          
        case ORDER_STATUS.FAIL:
          console.log('💥 Payment failed');
          // Handle failed payment
          break;
          
        default:
          console.log('❓ Unknown payment status:', result.paymentStatus);
      }
    } else {
      console.error('❌ Payment failed:', result.error);
    }

  } catch (error) {
    console.error('💥 Payment process error:', error);
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
  }
}

// Example with PostPayment (AppleTree integration)
async function processBillPaymentWithPostPayment() {
  try {
    const flowManager = new BillPaymentFlowManager((type, message, data) => {
      console.log(`[${type.toUpperCase()}] ${message}`, data || '');
    });

    const paymentData = {
      country: {
        countryCode: 'ZW',
        countryName: 'Zimbabwe'
      },
      service: {
        Id: '6',
        Name: 'Electricity'
      },
      provider: {
        Id: 'PRV_ZETDC',
        Name: 'ZETDC'
      },
      product: {
        Id: 'PN_TEST_ZETDC',
        Name: 'ZETDC Prepaid Electricity',
        Currency: 'USD'
      },
      accountValue: '1234567890',
      amount: 10.00,
      validationData: {
        Status: 'VALIDATED',
        DisplayData: [
          { Label: 'Account Name', Value: 'John Doe' }
        ]
      }
    };

    const userInfo = {
      CustomerId: 'user123',
      Fullname: 'John Doe',
      MobileNumber: '+263777077921',
      EmailAddress: 'john@example.com'
    };

    // Execute payment WITH PostPayment API call
    const result = await flowManager.executePayment(paymentData, {
      postToAppleTree: true, // Enable PostPayment
      userInfo: userInfo
    });

    if (result.success && result.appleTreeResult) {
      console.log('✅ Payment and fulfillment completed!');
      console.log('🌳 AppleTree Result:', result.appleTreeResult);
      console.log('📄 Receipt HTML:', result.appleTreeResult.receiptHTML);
      console.log('🎫 Vouchers:', result.appleTreeResult.vouchers);
      console.log('📊 Display Data:', result.appleTreeResult.displayData);
    }

  } catch (error) {
    console.error('💥 Payment process error:', error);
  }
}

// Export for use in other modules
export { processBillPayment, processBillPaymentWithPostPayment };

