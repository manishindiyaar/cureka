'use client';

import React, { useState } from 'react';
import { Button, Input, Field, Label } from '@headlessui/react';
import { useToast } from '../ui/Toast';
import { UserRole } from '../../types/enums';
import { WeHealthLogo } from './WeHealthLogo';

interface MinimalistLoginProps {
  onLogin: (email: string, password: string, role: UserRole) => Promise<void>;
}

export const MinimalistLogin: React.FC<MinimalistLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const toast = useToast();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Determine role based on email domain or predefined credentials
      let role = UserRole.DOCTOR;
      if (email.includes('pharmacist') || email === 'charles.green@cureka.com') {
        role = UserRole.PHARMACIST;
      } else if (email.includes('admin') || email === 'admin@cureka.com') {
        role = UserRole.ADMIN;
      }
      
      await onLogin(email, password, role);
      toast.success('Login successful');
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="text-center">
            <WeHealthLogo />
          </div>

          {/* Login Form */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in</h2>
              <p className="text-gray-600 text-sm">Welcome back! Please sign in to continue</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <Field>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wehealth-blue-500 focus:border-transparent transition-all duration-200"
                  invalid={!!errors.email}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </Field>

              <Field>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wehealth-blue-500 focus:border-transparent transition-all duration-200"
                  invalid={!!errors.password}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </Field>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-wehealth-blue-600 to-wehealth-blue-700 text-white py-3 px-4 rounded-xl font-medium hover:from-wehealth-blue-700 hover:to-wehealth-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wehealth-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isLoading ? 'Signing in...' : 'Submit'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-medium text-gray-700 mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p><span className="font-medium">Doctor:</span> anna.smith@cureka.com / doctor123</p>
                <p><span className="font-medium">Pharmacist:</span> charles.green@cureka.com / pharmacist123</p>
                <p><span className="font-medium">Admin:</span> admin@cureka.com / admin123</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-wehealth-blue-400 via-wehealth-blue-500 to-wehealth-teal-500 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-32 h-32 bg-wehealth-orange-400 rounded-full opacity-20"></div>
          <div className="absolute bottom-32 left-16 w-24 h-24 bg-wehealth-orange-300 rounded-full opacity-30"></div>
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-white rounded-full opacity-10"></div>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center w-full relative z-10 p-12">
          <div className="text-center text-white max-w-lg">
            {/* Doctor Image */}
            <div className="mb-8 relative">
              <div className="w-80 h-80 mx-auto rounded-full bg-gradient-to-br from-wehealth-orange-400 to-wehealth-orange-500 p-2">
                <img
                  src="https://images.unsplash.com/photo-1666887360388-93e684b6474a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwzfHxkb2N0b3IlMjBtZWRpY2FsJTIwcHJvZmVzc2lvbmFsJTIwc3RldGhvc2NvcGUlMjBoZWFsdGhjYXJlfGVufDB8MXx8fDE3NTg3ODM3Nzd8MA&ixlib=rb-4.1.0&q=85"
                  alt="Professional female doctor with stethoscope - Photo by Nappy on Unsplash"
                  className="w-full h-full object-cover rounded-full"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-3 shadow-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-wehealth-blue-500 to-wehealth-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">+</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-wehealth-orange-400 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <p className="text-white text-xs font-medium mt-2">50k+ Customers</p>
              </div>
            </div>

            {/* Text Content */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold leading-tight">
                Connect with a Doctor
              </h2>
              <p className="text-wehealth-blue-100 text-lg">
                Your health is our priority. Access quality healthcare from anywhere, anytime.
              </p>
            </div>

            {/* CTA Button */}
            <div className="mt-8">
              <button className="bg-wehealth-orange-500 text-white px-8 py-3 rounded-full font-medium hover:bg-wehealth-orange-600 transition-colors duration-200 shadow-lg">
                Explore Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};