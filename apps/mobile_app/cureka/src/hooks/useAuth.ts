import { useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE, endpoints } from '@/constants/endpoints';

console.log('API Base URL:', API_BASE); // Add this debug line

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  const requestOTP = async (phoneNumber: string): Promise<void> => {
    setIsLoading(true);
    try {
      const requestBody = { phone_number: phoneNumber };
      console.log('Request body:', requestBody);
      console.log('API Base:', API_BASE);
      console.log('endpoints.auth.requestOTP:', endpoints.auth.requestOTP);

      const fullUrl = `${API_BASE}/auth/patient/otp/request`;
      console.log('Requesting to URL:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status, response.statusText);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error(`Invalid response format: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Failed to send OTP (status: ${response.status})`);
      }

      return data;
    } catch (error) {
      console.error('Request error:', error);
      throw new Error(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (phoneNumber: string, otpCode: string): Promise<any> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/patient/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber, otp_code: otpCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      // Store tokens securely
      await SecureStore.setItemAsync('accessToken', data.data.access_token);
      await SecureStore.setItemAsync('refreshToken', data.data.refresh_token || '');

      const tokens = {
        accessToken: data.data.access_token,
        refreshToken: data.data.refresh_token || ''
      };

      setTokens(tokens);

      return {
        ...data,
        isNewUser: !data.data.user.full_name,
        tokens
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      setTokens(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      if (accessToken) {
        setTokens({ accessToken, refreshToken: refreshToken || '' });
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  return {
    requestOTP,
    verifyOTP,
    logout,
    checkAuthStatus,
    isLoading,
    tokens
  };
}