// Secure storage utilities
import * as SecureStore from 'expo-secure-store';

export const saveSecure = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Secure store save error:', error);
    throw error;
  }
};

export const getSecure = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Secure store get error:', error);
    return null;
  }
};

export const removeSecure = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Secure store delete error:', error);
  }
};