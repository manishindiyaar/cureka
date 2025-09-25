'use client';

import React, { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { Sidebar } from '../components/dashboard/Sidebar';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { DoctorList } from '../components/doctors/DoctorList';
import { DoctorForm } from '../components/doctors/DoctorForm';
import { PharmacistList } from '../components/pharmacists/PharmacistList';
import { PharmacistDetailModal } from '../components/pharmacists/PharmacistDetailModal';
import { AICopilot } from '../components/ai/AICopilot';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import { useDoctors } from '../hooks/useDoctors';
import { usePharmacists } from '../hooks/usePharmacists';
import { useAICopilot } from '../hooks/useAICopilot';
import { Doctor, Pharmacist } from '../types/schema';
import { useToast } from '../components/ui/Toast';

export default function HospitalAdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const { stats, alerts, dismissAlert } = useDashboard();
  const { doctors, addDoctor, updateDoctor, deleteDoctor } = useDoctors();
  const { pharmacists, getPharmacist, deletePharmacist } = usePharmacists();
  const { processQuery } = useAICopilot();
  const toast = useToast();

  const [activeSection, setActiveSection] = useState('dashboard');
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | undefined>();
  const [selectedPharmacist, setSelectedPharmacist] = useState<Pharmacist | null>(null);
  const [showPharmacistDetail, setShowPharmacistDetail] = useState(false);

  if (authLoading) {
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
    return <LoginForm onLogin={login} />;
  }

  const handleAddDoctor = () => {
    setEditingDoctor(undefined);
    setShowDoctorForm(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setShowDoctorForm(true);
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await deleteDoctor(doctorId);
        toast.success('Doctor deleted successfully');
      } catch (error) {
        toast.error('Failed to delete doctor');
      }
    }
  };

  const handleViewDoctor = (doctor: Doctor) => {
    // For now, just show a toast - in real app, this would open a detail modal
    toast.success(`Viewing details for ${doctor.name}`);
  };

  const handleDoctorFormSubmit = async (data: any) => {
    try {
      if (editingDoctor) {
        await updateDoctor(editingDoctor.id, data);
      } else {
        await addDoctor(data);
      }
      setShowDoctorForm(false);
      setEditingDoctor(undefined);
    } catch (error) {
      throw error; // Let the form handle the error
    }
  };

  const handleViewPharmacist = (pharmacist: Pharmacist) => {
    setSelectedPharmacist(pharmacist);
    setShowPharmacistDetail(true);
  };

  const handleEditPharmacist = (pharmacist: Pharmacist) => {
    toast.info('Edit pharmacist functionality coming soon');
  };

  const handleDeletePharmacist = async (pharmacistId: string) => {
    if (window.confirm('Are you sure you want to delete this pharmacist?')) {
      try {
        await deletePharmacist(pharmacistId);
        toast.success('Pharmacist deleted successfully');
      } catch (error) {
        toast.error('Failed to delete pharmacist');
      }
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardOverview
            stats={stats}
            alerts={alerts}
            onDismissAlert={dismissAlert}
          />
        );
      case 'doctors':
        return (
          <DoctorList
            doctors={doctors}
            onAddDoctor={handleAddDoctor}
            onEditDoctor={handleEditDoctor}
            onDeleteDoctor={handleDeleteDoctor}
            onViewDoctor={handleViewDoctor}
          />
        );
      case 'pharmacists':
        return (
          <PharmacistList
            pharmacists={pharmacists}
            onViewPharmacist={handleViewPharmacist}
            onEditPharmacist={handleEditPharmacist}
            onDeletePharmacist={handleDeletePharmacist}
          />
        );
      case 'ai-copilot':
        return <AICopilot onQuery={processQuery} />;
      case 'patients':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Management</h2>
            <p className="text-gray-600">Patient management features coming soon...</p>
          </div>
        );
      case 'appointments':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment Management</h2>
            <p className="text-gray-600">Appointment management features coming soon...</p>
          </div>
        );
      default:
        return (
          <DashboardOverview
            stats={stats}
            alerts={alerts}
            onDismissAlert={dismissAlert}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={logout}
        userName={user?.name || 'Admin User'}
      />
      
      <main className="flex-1 p-8">
        {renderContent()}
      </main>

      <DoctorForm
        isOpen={showDoctorForm}
        onClose={() => {
          setShowDoctorForm(false);
          setEditingDoctor(undefined);
        }}
        onSubmit={handleDoctorFormSubmit}
        doctor={editingDoctor}
      />

      <PharmacistDetailModal
        isOpen={showPharmacistDetail}
        onClose={() => {
          setShowPharmacistDetail(false);
          setSelectedPharmacist(null);
        }}
        pharmacist={selectedPharmacist}
      />
    </div>
  );
}