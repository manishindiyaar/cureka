'use client';

import React, { useState } from 'react';
import { DoctorSidebar } from '../components/doctor/DoctorSidebar';
import { AppointmentCard } from '../components/doctor/AppointmentCard';
import { PatientCard } from '../components/doctor/PatientCard';
import { PrescriptionForm } from '../components/doctor/PrescriptionForm';
import { AICopilot } from '../components/ai/AICopilot';
import { StatCard } from '../components/dashboard/StatCard';
import { Input } from '@headlessui/react';
import { Search, CalendarDays, Users, Pill, Clock } from 'lucide-react';
import { useDoctorData } from '../hooks/useDoctorData';
import { useRoleBasedAuth } from '../hooks/useRoleBasedAuth';
import { useAICopilot } from '../hooks/useAICopilot';
import { useToast } from '../components/ui/Toast';

export default function DoctorDashboard() {
  const { user, logout } = useRoleBasedAuth();
  const { appointments, patients, stats, acceptAppointment, declineAppointment, submitPrescription, searchPatients } = useDoctorData();
  const { processQuery } = useAICopilot();
  const toast = useToast();
  
  const [activeSection, setActiveSection] = useState('appointments');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAcceptAppointment = async (appointmentId: string) => {
    try {
      await acceptAppointment(appointmentId);
      toast.success('Appointment accepted successfully');
    } catch (error) {
      toast.error('Failed to accept appointment');
    }
  };

  const handleDeclineAppointment = async (appointmentId: string) => {
    try {
      await declineAppointment(appointmentId);
      toast.success('Appointment declined');
    } catch (error) {
      toast.error('Failed to decline appointment');
    }
  };

  const handleSubmitPrescription = async (prescription: any) => {
    try {
      await submitPrescription(prescription);
      toast.success('Prescription submitted successfully');
    } catch (error) {
      toast.error('Failed to submit prescription');
    }
  };

  const handleViewPatientDetails = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      toast.success(`Viewing details for ${patient.name}`);
    }
  };

  const filteredPatients = searchPatients(searchQuery);

  const renderContent = () => {
    switch (activeSection) {
      case 'appointments':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Today's Schedule</h2>
              <p className="text-gray-600">Manage your appointments and requests</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Today's Appointments"
                value={stats.todaysAppointments}
                icon={<CalendarDays size={24} />}
                color="blue"
              />
              <StatCard
                title="Pending Requests"
                value={stats.pendingRequests}
                icon={<Clock size={24} />}
                color="yellow"
              />
              <StatCard
                title="Completed Today"
                value={stats.completedToday}
                icon={<CalendarDays size={24} />}
                color="green"
              />
              <StatCard
                title="Total Patients"
                value={stats.totalPatients}
                icon={<Users size={24} />}
                color="blue"
              />
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments for today</h3>
                <p className="text-gray-600">Your schedule is clear. New appointments will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onAccept={appointment.status === 'pending' ? handleAcceptAppointment : undefined}
                    onDecline={appointment.status === 'pending' ? handleDeclineAppointment : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'patients':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Patient Records</h2>
                <p className="text-gray-600">Search and manage your patients</p>
              </div>
            </div>

            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No patients found' : 'No patients assigned'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery ? 'Try adjusting your search criteria' : 'Patient records will appear here when assigned'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onViewDetails={handleViewPatientDetails}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'prescriptions':
        return (
          <PrescriptionForm
            patients={patients}
            onSubmit={handleSubmitPrescription}
          />
        );

      case 'ai-assistant':
        return <AICopilot onQuery={processQuery} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DoctorSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={logout}
        userName={user?.name || 'Doctor'}
      />
      
      <main className="flex-1 p-8">
        {renderContent()}
      </main>
    </div>
  );
}