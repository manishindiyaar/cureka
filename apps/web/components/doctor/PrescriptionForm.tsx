'use client';

import React, { useState } from 'react';
import { Button, Input, Field, Label, Select, Textarea } from '@headlessui/react';
import { Card } from '../ui/Card';
import { Upload, User } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { Patient } from '../../types/schema';

interface PrescriptionFormProps {
  patients: Patient[];
  onSubmit: (prescription: {
    patientId: string;
    medication: string;
    dosage: string;
    duration: string;
    instructions: string;
    attachments?: File[];
  }) => Promise<void>;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  patients,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    patientId: '',
    medication: '',
    dosage: '',
    duration: '',
    instructions: ''
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.patientId) {
      newErrors.patientId = 'Please select a patient';
    }
    if (!formData.medication.trim()) {
      newErrors.medication = 'Medication is required';
    }
    if (!formData.dosage.trim()) {
      newErrors.dosage = 'Dosage is required';
    }
    if (!formData.duration.trim()) {
      newErrors.duration = 'Duration is required';
    }
    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
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
      await onSubmit({
        ...formData,
        attachments: attachments.length > 0 ? attachments : undefined
      });
      
      // Reset form
      setFormData({
        patientId: '',
        medication: '',
        dosage: '',
        duration: '',
        instructions: ''
      });
      setAttachments([]);
      toast.success('Prescription submitted successfully');
    } catch (error) {
      toast.error('Failed to submit prescription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const selectedPatient = patients.find(p => p.id === formData.patientId);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <User size={24} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upload Prescription</h2>
          <p className="text-gray-600">Create and submit a new prescription</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Select Patient *
            </Label>
            <Select
              value={formData.patientId}
              onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              invalid={!!errors.patientId}
            >
              <option value="">Choose a patient...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} (ID: {patient.patientId})
                </option>
              ))}
            </Select>
            {errors.patientId && (
              <p className="mt-1 text-sm text-red-600">{errors.patientId}</p>
            )}
          </Field>

          {selectedPatient && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Patient Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Age:</span> {selectedPatient.age} years
                </div>
                <div>
                  <span className="font-medium">Gender:</span> {selectedPatient.gender}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Medical History:</span> {selectedPatient.medicalHistory}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <Label className="block text-sm font-medium text-gray-700">
                Medication *
              </Label>
              <Input
                type="text"
                value={formData.medication}
                onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Amoxicillin 500mg"
                invalid={!!errors.medication}
              />
              {errors.medication && (
                <p className="mt-1 text-sm text-red-600">{errors.medication}</p>
              )}
            </Field>

            <Field>
              <Label className="block text-sm font-medium text-gray-700">
                Dosage *
              </Label>
              <Input
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 1 tablet every 8 hours"
                invalid={!!errors.dosage}
              />
              {errors.dosage && (
                <p className="mt-1 text-sm text-red-600">{errors.dosage}</p>
              )}
            </Field>
          </div>

          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Duration *
            </Label>
            <Input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 7 days"
              invalid={!!errors.duration}
            />
            {errors.duration && (
              <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
            )}
          </Field>

          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Instructions *
            </Label>
            <Textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Take with food. Complete the full course even if symptoms improve."
              invalid={!!errors.instructions}
            />
            {errors.instructions && (
              <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>
            )}
          </Field>

          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Attachments (Optional)
            </Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload files</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB each</p>
              </div>
            </div>
            {attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Selected files:</p>
                <ul className="mt-1 text-sm text-gray-600">
                  {attachments.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </Field>

          <div className="flex justify-end space-x-3 pt-6">
            <Button
              type="button"
              onClick={() => {
                setFormData({
                  patientId: '',
                  medication: '',
                  dosage: '',
                  duration: '',
                  instructions: ''
                });
                setAttachments([]);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit Prescription'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};