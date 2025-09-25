'use client';

import { useState, useEffect } from 'react';
import { DoctorAppointment, Patient, DoctorStats } from '../types/schema';
import { mockQuery } from '../data/doctorPharmacistMockData';

export const useDoctorData = () => {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<DoctorStats>({
    todaysAppointments: 0,
    totalPatients: 0,
    pendingRequests: 0,
    completedToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAppointments(mockQuery.doctorAppointments);
      setPatients(mockQuery.doctorPatients);
      setStats({
        todaysAppointments: mockQuery.doctorAppointments.length,
        totalPatients: mockQuery.doctorPatients.length,
        pendingRequests: mockQuery.doctorAppointments.filter(a => a.status === 'pending').length,
        completedToday: mockQuery.doctorAppointments.filter(a => a.status === 'completed').length
      });
      
      setIsLoading(false);
    };

    fetchDoctorData();
  }, []);

  const acceptAppointment = async (appointmentId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setAppointments(prev => prev.map(appointment => 
      appointment.id === appointmentId 
        ? { ...appointment, status: 'scheduled' as any }
        : appointment
    ));
  };

  const declineAppointment = async (appointmentId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setAppointments(prev => prev.map(appointment => 
      appointment.id === appointmentId 
        ? { ...appointment, status: 'cancelled' as any }
        : appointment
    ));
  };

  const submitPrescription = async (prescription: {
    patientId: string;
    medication: string;
    dosage: string;
    duration: string;
    instructions: string;
    attachments?: File[];
  }): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In real app, this would submit to API
  };

  const searchPatients = (query: string): Patient[] => {
    if (!query) return patients;
    
    return patients.filter(patient => 
      patient.name.toLowerCase().includes(query.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(query.toLowerCase()) ||
      patient.email.toLowerCase().includes(query.toLowerCase())
    );
  };

  return {
    appointments,
    patients,
    stats,
    isLoading,
    acceptAppointment,
    declineAppointment,
    submitPrescription,
    searchPatients
  };
};