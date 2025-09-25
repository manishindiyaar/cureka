'use client';

import { useState } from 'react';
import { mockQuery } from '../data/hospitalAdminMockData';

export const useAICopilot = () => {
  const [isLoading, setIsLoading] = useState(false);

  const processQuery = async (query: string): Promise<{ response: string; data?: any }> => {
    setIsLoading(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const lowerQuery = query.toLowerCase();
    
    // Simple query processing - in real app, this would be AI/ML powered
    if (lowerQuery.includes('doctor') || lowerQuery.includes('cardiologist')) {
      const doctors = mockQuery.doctors;
      if (lowerQuery.includes('cardiologist') || lowerQuery.includes('cardiology')) {
        const cardiologists = doctors.filter(d => d.specialty.toLowerCase().includes('cardiology'));
        setIsLoading(false);
        return {
          response: `I found ${cardiologists.length} cardiologist(s): ${cardiologists.map(d => d.name).join(', ')}. ${cardiologists.length > 0 ? cardiologists[0].name + ' is currently ' + cardiologists[0].availabilityStatus : ''}`,
          data: cardiologists
        };
      } else if (lowerQuery.includes('available')) {
        const availableDoctors = doctors.filter(d => d.availabilityStatus === 'available');
        setIsLoading(false);
        return {
          response: `Currently ${availableDoctors.length} doctors are available: ${availableDoctors.map(d => `Dr. ${d.name} (${d.specialty})`).join(', ')}`,
          data: availableDoctors
        };
      } else {
        setIsLoading(false);
        return {
          response: `We have ${doctors.length} doctors in total. They specialize in: ${doctors.map(d => d.specialty).join(', ')}`,
          data: doctors
        };
      }
    }
    
    if (lowerQuery.includes('pharmacist')) {
      const pharmacists = mockQuery.pharmacists;
      setIsLoading(false);
      return {
        response: `We have ${pharmacists.length} pharmacists: ${pharmacists.map(p => p.name).join(', ')}. They are located at: ${pharmacists.map(p => p.storeAddress).join(', ')}`,
        data: pharmacists
      };
    }
    
    if (lowerQuery.includes('appointment')) {
      const appointments = mockQuery.appointments;
      setIsLoading(false);
      return {
        response: `There are ${appointments.length} appointments today. ${appointments.filter(a => a.status === 'pending').length} are pending approval.`,
        data: appointments
      };
    }
    
    if (lowerQuery.includes('patient')) {
      setIsLoading(false);
      return {
        response: `We currently have 1,247 total patients in our system. 89 appointments are scheduled for today.`,
        data: { totalPatients: 1247, todaysAppointments: 89 }
      };
    }
    
    // Default response
    setIsLoading(false);
    return {
      response: `I can help you with information about doctors, pharmacists, patients, and appointments. Try asking something like "Show me all available doctors" or "How many appointments are scheduled today?"`
    };
  };

  return {
    processQuery,
    isLoading
  };
};