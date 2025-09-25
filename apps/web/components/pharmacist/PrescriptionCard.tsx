import React from 'react';
import { Button } from '@headlessui/react';
import { Card } from '../ui/Card';
import { User, Pill, Clock, AlertTriangle } from 'lucide-react';
import { PrescriptionCardProps } from '../../types/schema';
import { formatPrescriptionStatus } from '../../utils/formatters';

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
  onAccept,
  onDecline
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent') {
      return <AlertTriangle size={16} className="text-red-600" />;
    }
    return <Clock size={16} className="text-gray-600" />;
  };

  return (
    <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Pill size={20} className="text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{prescription.patientName}</h3>
            <p className="text-sm text-gray-600">Prescribed by {prescription.doctorName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(prescription.priority)} flex items-center space-x-1`}>
            {getPriorityIcon(prescription.priority)}
            <span className="capitalize">{prescription.priority}</span>
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {formatPrescriptionStatus(prescription.status)}
          </span>
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Prescription Details</h4>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Medication:</span> {prescription.medication}
            </div>
            <div>
              <span className="font-medium">Dosage:</span> {prescription.dosage}
            </div>
            <div>
              <span className="font-medium">Duration:</span> {prescription.duration}
            </div>
          </div>
        </div>
        
        {prescription.instructions && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Instructions</h4>
            <p className="text-sm text-gray-600">{prescription.instructions}</p>
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-500">
          <Clock size={16} className="mr-2" />
          <span>Prescribed: {new Date(prescription.prescribedDate).toLocaleString()}</span>
        </div>
      </div>

      {prescription.status === 'pending' && (
        <div className="flex space-x-2 pt-4 border-t border-gray-200">
          <Button
            onClick={() => onAccept(prescription.id)}
            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm font-medium flex items-center justify-center space-x-1"
          >
            <span>Accept</span>
          </Button>
          <Button
            onClick={() => onDecline(prescription.id)}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm font-medium flex items-center justify-center space-x-1"
          >
            <span>Decline</span>
          </Button>
        </div>
      )}
    </Card>
  );
};