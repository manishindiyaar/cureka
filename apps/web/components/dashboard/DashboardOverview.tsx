'use client';

import React from 'react';
import { StatCard } from './StatCard';
import { AlertPanel } from './AlertPanel';
import { Users, Stethoscope, CalendarClock, Pill } from 'lucide-react';
import { DashboardStats, Alert } from '../../types/schema';

interface DashboardOverviewProps {
  stats: DashboardStats;
  alerts: Alert[];
  onDismissAlert: (alertId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  alerts,
  onDismissAlert
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={<Users size={24} />}
          color="blue"
        />
        <StatCard
          title="Active Doctors"
          value={stats.activeDoctors}
          icon={<Stethoscope size={24} />}
          color="green"
        />
        <StatCard
          title="Today's Appointments"
          value={stats.todaysAppointments}
          icon={<CalendarClock size={24} />}
          color="yellow"
        />
        <StatCard
          title="Prescriptions"
          value={stats.pendingPrescriptions}
          icon={<Pill size={24} />}
          color="red"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Placeholder for additional dashboard content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <p className="text-gray-500">Activity feed will be displayed here...</p>
          </div>
        </div>
        
        <div>
          <AlertPanel alerts={alerts} onDismiss={onDismissAlert} />
        </div>
      </div>
    </div>
  );
};