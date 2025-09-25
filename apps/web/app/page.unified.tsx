'use client';

import React from 'react';
import { MinimalistLogin } from '../components/auth/MinimalistLogin';
import DoctorDashboard from './page.doctor';
import PharmacistDashboard from './page.pharmacist';
import HospitalAdminDashboard from './page.hospitaladmin';
import { useRoleBasedAuth } from '../hooks/useRoleBasedAuth';
import { UserRole } from '../types/enums';

export default function UnifiedPortal() {
  const { user, isAuthenticated, isLoading, login, logout } = useRoleBasedAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <MinimalistLogin onLogin={login} />;
  }

  // Route to appropriate dashboard based on user role
  switch (user?.role) {
    case UserRole.DOCTOR:
      return <DoctorDashboard />;
    case UserRole.PHARMACIST:
      return <PharmacistDashboard />;
    case UserRole.ADMIN:
      return <HospitalAdminDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Role</h2>
            <p className="text-gray-600 mb-4">Your account role is not recognized.</p>
            <button
              onClick={logout}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Logout
            </button>
          </div>
        </div>
      );
  }
}