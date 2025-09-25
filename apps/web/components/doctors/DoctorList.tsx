'use client';

import React, { useState } from 'react';
import { Button } from '@headlessui/react';
import { Card } from '../ui/Card';
import { UserPlus, Edit, Trash2, Eye } from 'lucide-react';
import { Doctor } from '../../types/schema';
import { formatSpecialty, formatAvailabilityStatus } from '../../utils/formatters';

interface DoctorListProps {
  doctors: Doctor[];
  onAddDoctor: () => void;
  onEditDoctor: (doctor: Doctor) => void;
  onDeleteDoctor: (doctorId: string) => void;
  onViewDoctor: (doctor: Doctor) => void;
}

export const DoctorList: React.FC<DoctorListProps> = ({
  doctors,
  onAddDoctor,
  onEditDoctor,
  onDeleteDoctor,
  onViewDoctor
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Doctor Management</h2>
        <Button
          onClick={onAddDoctor}
          className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 flex items-center space-x-2"
        >
          <UserPlus size={20} />
          <span>Add Doctor</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                <p className="text-sm text-gray-600">{formatSpecialty(doctor.specialty)}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doctor.availabilityStatus)}`}
              >
                {formatAvailabilityStatus(doctor.availabilityStatus)}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {doctor.email}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Joined:</span> {new Date(doctor.joiningDate).toLocaleDateString()}
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => onViewDoctor(doctor)}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 flex items-center justify-center space-x-1"
              >
                <Eye size={16} />
                <span>View</span>
              </Button>
              <Button
                onClick={() => onEditDoctor(doctor)}
                className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 flex items-center justify-center space-x-1"
              >
                <Edit size={16} />
                <span>Edit</span>
              </Button>
              <Button
                onClick={() => onDeleteDoctor(doctor.id)}
                className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 flex items-center justify-center space-x-1"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {doctors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No doctors found</p>
          <p className="text-gray-400 text-sm mt-2">Add your first doctor to get started</p>
        </div>
      )}
    </div>
  );
};