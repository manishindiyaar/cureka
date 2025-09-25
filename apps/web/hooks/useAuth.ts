'use client';

import { useState, useEffect } from 'react';
import { User } from '../types/schema';
import { mockStore } from '../data/hospitalAdminMockData';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for existing session
    const checkAuth = () => {
      const savedAuth = localStorage.getItem('hospital-admin-auth');
      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        setUser(authData.user);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation - in real app, this would be an API call
    if (email === 'admin@cureka.com' && password === 'admin123') {
      const authData = {
        user: mockStore.currentUser,
        token: 'mock-jwt-token'
      };
      
      localStorage.setItem('hospital-admin-auth', JSON.stringify(authData));
      setUser(mockStore.currentUser);
      setIsAuthenticated(true);
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem('hospital-admin-auth');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In real app, this would update the password via API
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updatePassword
  };
};