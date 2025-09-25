'use client';

import { useState, useEffect } from 'react';
import { User } from '../types/schema';
import { UserRole } from '../types/enums';
import { mockStore } from '../data/doctorPharmacistMockData';

export const useRoleBasedAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = () => {
      const savedAuth = localStorage.getItem('role-based-auth');
      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        setUser(authData.user);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation
    let mockUser: User | null = null;
    
    if (role === UserRole.DOCTOR && (email === 'anna.smith@cureka.com' || email === 'doctor@cureka.com') && password === 'doctor123') {
      mockUser = {
        ...mockStore.doctorUser,
        role: UserRole.DOCTOR
      };
    } else if (role === UserRole.PHARMACIST && (email === 'charles.green@cureka.com' || email === 'pharmacist@cureka.com') && password === 'pharmacist123') {
      mockUser = {
        ...mockStore.pharmacistUser,
        role: UserRole.PHARMACIST
      };
    } else if (role === UserRole.ADMIN && email === 'admin@cureka.com' && password === 'admin123') {
      mockUser = {
        id: 'admin-001',
        name: 'Dr. Sarah Johnson',
        email: 'admin@cureka.com',
        role: UserRole.ADMIN,
        hospitalId: 'hospital-001'
      };
    }
    
    if (mockUser) {
      const authData = {
        user: mockUser,
        token: 'mock-jwt-token'
      };
      
      localStorage.setItem('role-based-auth', JSON.stringify(authData));
      setUser(mockUser);
      setIsAuthenticated(true);
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem('role-based-auth');
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  };
};