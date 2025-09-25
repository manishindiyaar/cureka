'use client';

import React from 'react';
import { Button } from '@headlessui/react';
import { 
  CalendarDays, 
  User, 
  Pill, 
  Bot,
  LogOut 
} from 'lucide-react';

interface DoctorSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  userName: string;
}

const navigationItems = [
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'patients', label: 'Patient Records', icon: User },
  { id: 'prescriptions', label: 'Upload Prescription', icon: Pill },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
];

export const DoctorSidebar: React.FC<DoctorSidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  onLogout,
  userName 
}) => {
  return (
    <div className="bg-blue-800 text-white w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-xl font-bold">Care-Connect</h1>
        <p className="text-blue-200 text-sm mt-1">Doctor Portal</p>
        <p className="text-blue-100 text-sm mt-2">{userName}</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-blue-700">
        <Button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};