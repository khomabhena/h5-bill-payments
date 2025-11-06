/**
 * AppleTree Gateway API Service
 * Handles all API calls to AppleTree Gateway for bill payments
 * Uses AppleTreeGateway class for proper header handling
 */

import AppleTreeGateway from './AppleTreeGateway.js';

// Create gateway instance
const gateway = new AppleTreeGateway({
  merchantId: '23de4621-ea24-433f-9b45-dc1e383d8c2b',
  baseUrl: 'https://sandbox-dev.appletreepayments.com',
  apiVersion: 'V2'
});

/**
 * Get available countries from AppleTree Gateway
 */
export const getCountries = async () => {
  try {
    const response = await gateway.getCountries();
    return response;
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
};

/**
 * Get services for a specific country
 */
export const getServices = async (countryCode) => {
  try {
    const response = await gateway.getServices(countryCode);
    return response;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

/**
 * Get service providers for a country and service
 */
export const getServiceProviders = async (filters) => {
  try {
    const response = await gateway.getServiceProviders(filters);
    return response;
  } catch (error) {
    console.error('Error fetching service providers:', error);
    throw error;
  }
};

/**
 * Get products for a country and service
 */
export const getProducts = async (filters) => {
  try {
    const response = await gateway.getProducts(filters);
    return response;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (productId) => {
  try {
    const response = await gateway.getProductById(productId);
    return response;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

/**
 * Validate payment before processing
 */
export const validatePayment = async (paymentData) => {
  try {
    const response = await gateway.validatePayment(paymentData);
    return response;
  } catch (error) {
    console.error('Error validating payment:', error);
    throw error;
  }
};

