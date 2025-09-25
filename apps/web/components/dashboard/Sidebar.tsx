'use client';

import React from 'react';
import { Button } from '@headlessui/react';
import { 
  LayoutGrid, 
  Stethoscope, 
  Pill, 
  Users, 
  CalendarClock, 
  Bot,
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  userName: string;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'ai-copilot', label: 'AI Copilot', icon: Bot },
  { id: 'doctors', label: 'Doctor Management', icon: Stethoscope },
  { id: 'pharmacists', label: 'Pharmacist Management', icon: Pill },
  { id: 'patients', label: 'Patient Management', icon: Users },
  { id: 'appointments', label: 'Appointment Management', icon: CalendarClock },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  onLogout,
  userName 
}) => {
  return (
    <div className="bg-blue-800 text-white w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-xl font-bold">Cureka Admin</h1>
        <p className="text-blue-200 text-sm mt-1">{userName}</p>
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