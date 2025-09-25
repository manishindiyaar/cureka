import React from 'react';
import { Button } from '@headlessui/react';
import { Card } from '../ui/Card';
import { CalendarDays, Clock, User } from 'lucide-react';
import { DoctorAppointment, AppointmentCardProps } from '../../types/schema';
import { formatAppointmentStatus, formatAppointmentType } from '../../utils/formatters';

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onAccept,
  onDecline,
  onReschedule
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-purple-100 text-purple-800';
      case 'follow_up':
        return 'bg-blue-100 text-blue-800';
      case 'check_up':
        return 'bg-green-100 text-green-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <User size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{appointment.patientName}</h3>
            <p className="text-sm text-gray-600">Patient ID: {appointment.patientId}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
            {formatAppointmentStatus(appointment.status)}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(appointment.type)}`}>
            {formatAppointmentType(appointment.type)}
          </span>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <CalendarDays size={16} className="mr-2" />
          <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock size={16} className="mr-2" />
          <span>{appointment.appointmentTime} ({appointment.duration} min)</span>
        </div>
        {appointment.notes && (
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-medium">Notes:</span> {appointment.notes}
          </p>
        )}
      </div>

      {appointment.status === 'pending' && (onAccept || onDecline) && (
        <div className="flex space-x-2 pt-4 border-t border-gray-200">
          {onAccept && (
            <Button
              onClick={() => onAccept(appointment.id)}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
            >
              Accept
            </Button>
          )}
          {onDecline && (
            <Button
              onClick={() => onDecline(appointment.id)}
              className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
            >
              Decline
            </Button>
          )}
          {onReschedule && (
            <Button
              onClick={() => onReschedule(appointment.id)}
              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Reschedule
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};