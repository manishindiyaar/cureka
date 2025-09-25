'use client';

import { useState, useEffect } from 'react';
import { DashboardStats, Alert } from '../types/schema';
import { mockQuery } from '../data/hospitalAdminMockData';

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeDoctors: 0,
    todaysAppointments: 0,
    pendingPrescriptions: 0
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalPatients: 1247,
        activeDoctors: mockQuery.doctors.length,
        todaysAppointments: 89,
        pendingPrescriptions: 15
      });
      
      setAlerts(mockQuery.realtimeAlerts);
      setIsLoading(false);
    };

    fetchDashboardData();
  }, []);

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const addAlert = (alert: Alert) => {
    setAlerts(prev => [alert, ...prev]);
  };

  return {
    stats,
    alerts,
    isLoading,
    dismissAlert,
    addAlert,
    setStats
  };
};