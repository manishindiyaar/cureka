'use client';

import { useState, useEffect } from 'react';
import { Pharmacist } from '../types/schema';
import { mockQuery } from '../data/hospitalAdminMockData';

export const usePharmacists = () => {
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPharmacists = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setPharmacists(mockQuery.pharmacists);
      setIsLoading(false);
    };

    fetchPharmacists();
  }, []);

  const getPharmacist = (pharmacistId: string): Pharmacist | undefined => {
    return pharmacists.find(pharmacist => pharmacist.id === pharmacistId);
  };

  const deletePharmacist = async (pharmacistId: string): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setPharmacists(prev => prev.filter(pharmacist => pharmacist.id !== pharmacistId));
  };

  return {
    pharmacists,
    isLoading,
    getPharmacist,
    deletePharmacist
  };
};