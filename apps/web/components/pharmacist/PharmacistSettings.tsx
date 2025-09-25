'use client';

import React, { useState } from 'react';
import { Button, Input, Field, Label } from '@headlessui/react';
import { Card } from '../ui/Card';
import { Settings, User } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { PharmacistProfile } from '../../types/schema';

interface PharmacistSettingsProps {
  profile: PharmacistProfile;
  onUpdateProfile: (profile: Partial<PharmacistProfile>) => Promise<void>;
}

export const PharmacistSettings: React.FC<PharmacistSettingsProps> = ({
  profile,
  onUpdateProfile
}) => {
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    qualifications: profile.qualifications,
    storeAddress: profile.storeAddress,
    phone: profile.phone || '',
    licenseNumber: profile.licenseNumber || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.qualifications.trim()) {
      newErrors.qualifications = 'Qualifications are required';
    }
    if (!formData.storeAddress.trim()) {
      newErrors.storeAddress = 'Store address is required';
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
      await onUpdateProfile(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name,
      email: profile.email,
      qualifications: profile.qualifications,
      storeAddress: profile.storeAddress,
      phone: profile.phone || '',
      licenseNumber: profile.licenseNumber || ''
    });
    setIsEditing(false);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <Settings size={24} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-gray-600">Manage your profile and preferences</p>
          </div>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-red-800 text-white px-4 py-2 rounded-md hover:bg-red-900"
          >
            Edit Profile
          </Button>
        )}
      </div>

      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-full">
            <User size={32} className="text-gray-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
            <p className="text-gray-600">Update your personal and professional details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field>
              <Label className="block text-sm font-medium text-gray-700">
                Full Name *
              </Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                invalid={!!errors.name}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-700">
                Email Address *
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={!isEditing}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                invalid={!!errors.email}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={!isEditing}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="+1-555-0123"
              />
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-700">
                License Number
              </Label>
              <Input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                disabled={!isEditing}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="PH123456"
              />
            </Field>
          </div>

          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Qualifications *
            </Label>
            <Input
              type="text"
              value={formData.qualifications}
              onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value }))}
              disabled={!isEditing}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="PharmD, MBA"
              invalid={!!errors.qualifications}
            />
            {errors.qualifications && (
              <p className="mt-1 text-sm text-red-600">{errors.qualifications}</p>
            )}
          </Field>

          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Store Address *
            </Label>
            <Input
              type="text"
              value={formData.storeAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, storeAddress: e.target.value }))}
              disabled={!isEditing}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Main Pharmacy, Ground Floor"
              invalid={!!errors.storeAddress}
            />
            {errors.storeAddress && (
              <p className="mt-1 text-sm text-red-600">{errors.storeAddress}</p>
            )}
          </Field>

          {isEditing && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-900 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};