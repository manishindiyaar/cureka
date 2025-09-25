'use client';

import React from 'react';
import { Button } from '@headlessui/react';
import { 
  Pill, 
  Database, 
  Settings,
  Bot,
  LogOut 
} from 'lucide-react';

interface PharmacistSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  userName: string;
}

const navigationItems = [
  { id: 'prescriptions', label: 'New Prescription Requests', icon: Pill },
  { id: 'past-records', label: 'Past Records', icon: Database },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const PharmacistSidebar: React.FC<PharmacistSidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  onLogout,
  userName 
}) => {
  return (
    <div className="bg-red-800 text-white w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-red-700">
        <h1 className="text-xl font-bold">Care-Connect</h1>
        <p className="text-red-200 text-sm mt-1">Pharmacist Portal</p>
        <p className="text-red-100 text-sm mt-2">{userName}</p>
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
                      ? 'bg-red-700 text-white'
                      : 'text-red-200 hover:bg-red-700 hover:text-white'
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
      
      <div className="p-4 border-t border-red-700">
        <Button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-200 hover:bg-red-700 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};