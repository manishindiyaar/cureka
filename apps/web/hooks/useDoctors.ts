'use client';

import { useState, useEffect } from 'react';
import { Doctor, DoctorFormData } from '../types/schema';
import { mockQuery } from '../data/hospitalAdminMockData';
import { AvailabilityStatus } from '../types/enums';

export const useDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setDoctors(mockQuery.doctors);
      setIsLoading(false);
    };

    fetchDoctors();
  }, []);

  const addDoctor = async (doctorData: DoctorFormData): Promise<Doctor> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newDoctor: Doctor = {
      id: `doc-${Date.now()}`,
      ...doctorData,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      joiningDate: new Date().toISOString()
    };

    setDoctors(prev => [...prev, newDoctor]);
    return newDoctor;
  };

  const updateDoctor = async (id: string, updates: Partial<DoctorFormData>): Promise<Doctor> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setDoctors(prev => prev.map(doctor => 
      doctor.id === id ? { ...doctor, ...updates } : doctor
    ));
    
    return doctors.find(d => d.id === id)!;
  };

  const deleteDoctor = async (doctorId: string): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setDoctors(prev => prev.filter(doctor => doctor.id !== doctorId));
  };

  const getDoctor = (doctorId: string): Doctor | undefined => {
    return doctors.find(doctor => doctor.id === doctorId);
  };

  return {
    doctors,
    isLoading,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    getDoctor
  };
};