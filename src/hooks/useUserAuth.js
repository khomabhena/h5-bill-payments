import { useState, useEffect, useCallback } from 'react';
import { UserService } from '../../h5-automation-api/superapp/UserService';

/**
 * Custom hook for user authentication and phone number retrieval
 */
export const useUserAuth = () => {
  const [userData, setUserData] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const userService = new UserService();

  const getStoredToken = () => {
    const urlToken = new URLSearchParams(window.location.search).get('token');
    if (urlToken) {
      try {
        sessionStorage.setItem('superapp_token', urlToken);
      } catch (storageError) {
        console.warn('⚠️ Unable to store SuperApp token', storageError);
      }
      return urlToken;
    }

    try {
      const storedToken = sessionStorage.getItem('superapp_token');
      if (storedToken) {
        return storedToken;
      }
    } catch (storageError) {
      console.warn('⚠️ Unable to read stored SuperApp token', storageError);
    }

    return null;
  };

  /**
   * Get auth token from SuperApp SDK
   */
  const getAuthToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Getting auth token from SuperApp SDK...');
      const authToken = await userService.getAuthToken();
      
      console.log('✅ Auth token received:', authToken);
      
      setUserData(prev => ({ ...prev, authToken }));
      
      return authToken;
    } catch (err) {
      const errorMessage = err.message || 'Failed to get auth token';
      console.error('❌ Auth token error:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userService]);

  /**
   * Get openId from API using URL token
   */
  const getOpenId = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Getting openId from API...');
      const urlToken = getStoredToken();
      
      if (!urlToken) {
        throw new Error('No token found in URL');
      }
      
      const openId = await userService.getOpenId(urlToken);
      
      console.log('✅ OpenId received:', openId);
      
      setUserData(prev => ({ ...prev, openId }));
      
      return openId;
    } catch (err) {
      const errorMessage = err.message || 'Failed to get openId';
      console.error('❌ OpenId error:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userService]);

  /**
   * Complete flow: Get openId and user info with dynamic values
   */
  const getCompleteUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting complete user data flow...');
      
      // Get URL token
      const urlToken = getStoredToken();
      if (!urlToken) {
        throw new Error('No token found in URL');
      }
      
      // Get auth token from SuperApp SDK
      const authToken = await userService.getAuthToken();
      
      // Get complete user data (openId + user info + phone number)
      const result = await userService.getOpenIdAndUserInfo(urlToken, authToken);
      
      console.log('✅ Complete user data received:', result);
      
      setUserData(result);
      setPhoneNumber(result.phoneNumber);
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to get complete user data';
      
      // Only log as error if it's not the expected "No token found in URL" error
      if (err.message === 'No token found in URL') {
        console.log('ℹ️ No SuperApp token in URL - this is expected in browser testing');
      } else {
        console.error('❌ Complete flow error:', err);
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userService]);

  /**
   * Clear user data
   */
  const clearUserData = useCallback(() => {
    setUserData(null);
    setPhoneNumber(null);
    setError(null);
  }, []);

  /**
   * Retry getting auth token
   */
  const retryAuth = useCallback(async () => {
    return await getAuthToken();
  }, [getAuthToken]);

  return {
    // State
    userData,
    phoneNumber,
    isLoading,
    error,
    
    // Actions
    getAuthToken,
    getOpenId,
    getCompleteUserData,
    clearUserData,
    retryAuth: getAuthToken,
    
    // Computed
    isAuthenticated: !!userData,
    hasPhoneNumber: !!phoneNumber
  };
};

