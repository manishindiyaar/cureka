'use client';

import React from 'react';
import { Button } from '@headlessui/react';
import { Card } from '../ui/Card';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Pharmacist } from '../../types/schema';
import { formatAvailabilityStatus } from '../../utils/formatters';

interface PharmacistListProps {
  pharmacists: Pharmacist[];
  onViewPharmacist: (pharmacist: Pharmacist) => void;
  onEditPharmacist: (pharmacist: Pharmacist) => void;
  onDeletePharmacist: (pharmacistId: string) => void;
}

export const PharmacistList: React.FC<PharmacistListProps> = ({
  pharmacists,
  onViewPharmacist,
  onEditPharmacist,
  onDeletePharmacist
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_leave':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Pharmacist Management</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pharmacists.map((pharmacist) => (
          <Card key={pharmacist.id} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{pharmacist.name}</h3>
                <p className="text-sm text-gray-600">{pharmacist.qualifications}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pharmacist.availabilityStatus)}`}
              >
                {formatAvailabilityStatus(pharmacist.availabilityStatus)}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {pharmacist.email}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Store:</span> {pharmacist.storeAddress}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Joined:</span> {new Date(pharmacist.joiningDate).toLocaleDateString()}
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => onViewPharmacist(pharmacist)}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 flex items-center justify-center space-x-1"
              >
                <Eye size={16} />
                <span>View</span>
              </Button>
              <Button
                onClick={() => onEditPharmacist(pharmacist)}
                className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 flex items-center justify-center space-x-1"
              >
                <Edit size={16} />
                <span>Edit</span>
              </Button>
              <Button
                onClick={() => onDeletePharmacist(pharmacist.id)}
                className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 flex items-center justify-center space-x-1"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {pharmacists.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No pharmacists found</p>
          <p className="text-gray-400 text-sm mt-2">Pharmacist data will be displayed here</p>
        </div>
      )}
    </div>
  );
};