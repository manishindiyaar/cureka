'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { Pharmacist } from '../../types/schema';
import { formatAvailabilityStatus } from '../../utils/formatters';

interface PharmacistDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacist: Pharmacist | null;
}

export const PharmacistDetailModal: React.FC<PharmacistDetailModalProps> = ({
  isOpen,
  onClose,
  pharmacist
}) => {
  if (!pharmacist) return null;

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pharmacist Details"
      size="md"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{pharmacist.name}</h3>
            <p className="text-gray-600">{pharmacist.qualifications}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pharmacist.availabilityStatus)}`}
          >
            {formatAvailabilityStatus(pharmacist.availabilityStatus)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h4>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {pharmacist.email}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Work Information</h4>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Store Address:</span> {pharmacist.storeAddress}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Joining Date:</span> {new Date(pharmacist.joiningDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Qualifications</h4>
          <p className="text-sm text-gray-600">{pharmacist.qualifications}</p>
        </div>
      </div>
    </Modal>
  );
};