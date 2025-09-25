'use client';

import React, { useState } from 'react';
import { Button, Input, Field, Label, Select } from '@headlessui/react';
import { Modal } from '../ui/Modal';
import { Doctor, DoctorFormData } from '../../types/schema';
import { DoctorSpecialty, WeekDay } from '../../types/enums';
import { useToast } from '../ui/Toast';

interface DoctorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DoctorFormData) => Promise<void>;
  doctor?: Doctor;
}

const weekDays = Object.values(WeekDay);
const specialties = Object.values(DoctorSpecialty);

export const DoctorForm: React.FC<DoctorFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  doctor
}) => {
  const [formData, setFormData] = useState<DoctorFormData>({
    name: doctor?.name || '',
    email: doctor?.email || '',
    specialty: doctor?.specialty || DoctorSpecialty.GENERAL_MEDICINE,
    weeklyAvailability: doctor?.weeklyAvailability || {
      [WeekDay.MONDAY]: { start: '09:00', end: '17:00' },
      [WeekDay.TUESDAY]: { start: '09:00', end: '17:00' },
      [WeekDay.WEDNESDAY]: { start: '09:00', end: '17:00' },
      [WeekDay.THURSDAY]: { start: '09:00', end: '17:00' },
      [WeekDay.FRIDAY]: { start: '09:00', end: '17:00' },
      [WeekDay.SATURDAY]: { start: '09:00', end: '13:00' },
      [WeekDay.SUNDAY]: { start: '09:00', end: '13:00' }
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      toast.success(doctor ? 'Doctor updated successfully' : 'Doctor added successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save doctor');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvailability = (day: WeekDay, field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      weeklyAvailability: {
        ...prev.weeklyAvailability,
        [day]: {
          ...prev.weeklyAvailability[day],
          [field]: value
        }
      }
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={doctor ? 'Edit Doctor' : 'Add New Doctor'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Name *
            </Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              invalid={!!errors.name}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </Field>

          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Email *
            </Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              invalid={!!errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </Field>
        </div>

        <Field>
          <Label className="block text-sm font-medium text-gray-700">
            Specialty
          </Label>
          <Select
            value={formData.specialty}
            onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value as DoctorSpecialty }))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-3">
            Weekly Availability
          </Label>
          <div className="space-y-3">
            {weekDays.map((day) => (
              <div key={day} className="flex items-center space-x-4">
                <div className="w-24">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {day}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="time"
                    value={formData.weeklyAvailability[day].start}
                    onChange={(e) => updateAvailability(day, 'start', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="time"
                    value={formData.weeklyAvailability[day].end}
                    onChange={(e) => updateAvailability(day, 'end', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (doctor ? 'Update Doctor' : 'Add Doctor')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};