'use client';

import React, { useState } from 'react';
import { PharmacistSidebar } from '../components/pharmacist/PharmacistSidebar';
import { PrescriptionCard } from '../components/pharmacist/PrescriptionCard';
import { PharmacistSettings } from '../components/pharmacist/PharmacistSettings';
import { AICopilot } from '../components/ai/AICopilot';
import { StatCard } from '../components/dashboard/StatCard';
import { Card } from '../components/ui/Card';
import { Input } from '@headlessui/react';
import { Search, Pill, Clock, Database, CheckCircle } from 'lucide-react';
import { usePharmacistData } from '../hooks/usePharmacistData';
import { useRoleBasedAuth } from '../hooks/useRoleBasedAuth';
import { useAICopilot } from '../hooks/useAICopilot';
import { useToast } from '../components/ui/Toast';
import { formatPrescriptionStatus } from '../utils/formatters';

export default function PharmacistDashboard() {
  const { user, logout } = useRoleBasedAuth();
  const { prescriptionQueue, pastRecords, stats, profile, processPrescription, updateProfile, searchPrescriptions } = usePharmacistData();
  const { processQuery } = useAICopilot();
  const toast = useToast();
  
  const [activeSection, setActiveSection] = useState('prescriptions');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAcceptPrescription = async (prescriptionId: string) => {
    try {
      await processPrescription(prescriptionId, 'accept');
      toast.success('Prescription approved successfully');
    } catch (error) {
      toast.error('Failed to approve prescription');
    }
  };

  const handleDeclinePrescription = async (prescriptionId: string) => {
    try {
      await processPrescription(prescriptionId, 'decline', 'Medication not available');
      toast.success('Prescription declined');
    } catch (error) {
      toast.error('Failed to decline prescription');
    }
  };

  const handleUpdateProfile = async (profileData: any) => {
    try {
      await updateProfile(profileData);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const filteredPrescriptions = searchPrescriptions(searchQuery);

  const renderContent = () => {
    switch (activeSection) {
      case 'prescriptions':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">New Prescription Requests</h2>
              <p className="text-gray-600">Review and process pending prescriptions</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Pending Prescriptions"
                value={stats.pendingPrescriptions}
                icon={<Pill size={24} />}
                color="yellow"
              />
              <StatCard
                title="Processed Today"
                value={stats.processedToday}
                icon={<CheckCircle size={24} />}
                color="green"
              />
              <StatCard
                title="Total Processed"
                value={stats.totalProcessed}
                icon={<Database size={24} />}
                color="blue"
              />
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                    <Clock size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg. Processing Time</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageProcessingTime}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search prescriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {filteredPrescriptions.length === 0 ? (
              <div className="text-center py-12">
                <Pill size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No prescriptions found' : 'No pending prescriptions'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery ? 'Try adjusting your search criteria' : 'New prescription requests will appear here'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredPrescriptions.map((prescription) => (
                  <PrescriptionCard
                    key={prescription.id}
                    prescription={prescription}
                    onAccept={handleAcceptPrescription}
                    onDecline={handleDeclinePrescription}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'past-records':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Past Records</h2>
              <p className="text-gray-600">History of processed prescriptions</p>
            </div>

            {pastRecords.length === 0 ? (
              <div className="text-center py-12">
                <Database size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No past records</h3>
                <p className="text-gray-600">Processed prescriptions will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastRecords.map((record) => (
                  <Card key={record.id} className="border-l-4 border-l-gray-400">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{record.patientName}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {formatPrescriptionStatus(record.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Medication:</span> {record.medication}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Doctor:</span> {record.doctorName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Processed: {new Date(record.processedDate).toLocaleString()}
                        </p>
                        {record.rejectionReason && (
                          <p className="text-sm text-red-600 mt-1">
                            <span className="font-medium">Reason:</span> {record.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <PharmacistSettings
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
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
      <PharmacistSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={logout}
        userName={user?.name || 'Pharmacist'}
      />
      
      <main className="flex-1 p-8">
        {renderContent()}
      </main>
    </div>
  );
}