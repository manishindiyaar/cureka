import React from 'react';
import { Button } from '@headlessui/react';
import { Card } from '../ui/Card';
import { User, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { PatientCardProps } from '../../types/schema';
import { formatPatientGender } from '../../utils/formatters';

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onViewDetails,
  onEdit
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewDetails(patient.id)}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-full">
            <User size={24} className="text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
            <p className="text-sm text-gray-600">ID: {patient.patientId}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{patient.age} years</p>
          <p className="text-sm text-gray-600">{formatPatientGender(patient.gender)}</p>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Phone size={16} className="mr-2" />
          <span>{patient.phone}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Mail size={16} className="mr-2" />
          <span>{patient.email}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin size={16} className="mr-2" />
          <span className="truncate">{patient.address}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar size={16} className="mr-2" />
          <span>Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-1">Medical History</h4>
        <p className="text-sm text-gray-600 line-clamp-2">{patient.medicalHistory}</p>
      </div>

      <div className="flex space-x-2 pt-4 border-t border-gray-200">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(patient.id);
          }}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          View Details
        </Button>
        {onEdit && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(patient.id);
            }}
            className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 text-sm font-medium"
          >
            Edit
          </Button>
        )}
      </div>
    </Card>
  );
};