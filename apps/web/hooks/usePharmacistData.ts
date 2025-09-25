'use client';

import { useState, useEffect } from 'react';
import { PrescriptionRequest, ProcessedPrescription, PharmacistStats, PharmacistProfile } from '../types/schema';
import { mockQuery, mockStore } from '../data/doctorPharmacistMockData';

export const usePharmacistData = () => {
  const [prescriptionQueue, setPrescriptionQueue] = useState<PrescriptionRequest[]>([]);
  const [pastRecords, setPastRecords] = useState<ProcessedPrescription[]>([]);
  const [stats, setStats] = useState<PharmacistStats>({
    pendingPrescriptions: 0,
    processedToday: 0,
    totalProcessed: 0,
    averageProcessingTime: '0 minutes'
  });
  const [profile, setProfile] = useState<PharmacistProfile>({
    id: mockStore.pharmacistUser.id,
    name: mockStore.pharmacistUser.name,
    email: mockStore.pharmacistUser.email,
    qualifications: 'PharmD, MBA',
    storeAddress: mockStore.pharmacistUser.storeAddress
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPharmacistData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPrescriptionQueue(mockQuery.prescriptionRequests);
      setPastRecords(mockQuery.pastPrescriptions);
      setStats({
        pendingPrescriptions: mockQuery.prescriptionRequests.length,
        processedToday: 12,
        totalProcessed: 1247,
        averageProcessingTime: '4.5 minutes'
      });
      
      setIsLoading(false);
    };

    fetchPharmacistData();
  }, []);

  const processPrescription = async (prescriptionId: string, action: 'accept' | 'decline', reason?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const prescription = prescriptionQueue.find(p => p.id === prescriptionId);
    if (prescription) {
      // Remove from queue
      setPrescriptionQueue(prev => prev.filter(p => p.id !== prescriptionId));
      
      // Add to past records
      const processedPrescription: ProcessedPrescription = {
        id: prescription.id,
        patientName: prescription.patientName,
        doctorName: prescription.doctorName,
        medication: prescription.medication,
        status: action === 'accept' ? 'approved' as any : 'rejected' as any,
        processedDate: new Date().toISOString(),
        processedBy: profile.name,
        rejectionReason: reason
      };
      
      setPastRecords(prev => [processedPrescription, ...prev]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingPrescriptions: prev.pendingPrescriptions - 1,
        processedToday: prev.processedToday + 1
      }));
    }
  };

  const updateProfile = async (profileData: Partial<PharmacistProfile>): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setProfile(prev => ({ ...prev, ...profileData }));
  };

  const searchPrescriptions = (query: string): PrescriptionRequest[] => {
    if (!query) return prescriptionQueue;
    
    return prescriptionQueue.filter(prescription => 
      prescription.patientName.toLowerCase().includes(query.toLowerCase()) ||
      prescription.doctorName.toLowerCase().includes(query.toLowerCase()) ||
      prescription.medication.toLowerCase().includes(query.toLowerCase())
    );
  };

  return {
    prescriptionQueue,
    pastRecords,
    stats,
    profile,
    isLoading,
    processPrescription,
    updateProfile,
    searchPrescriptions
  };
};