/**
 * Appointment Validation Rules
 */

import { body, param, query } from 'express-validator';
import { AppointmentType } from './appointments.dto.js';

 /**
  * Validate appointment creation request
  */
export const createAppointmentValidation = [
  // doctor_id validation
  body('doctor_id')
    .isUUID(4)
    .withMessage('Doctor ID must be valid UUID-4'),

  // appointment_datetime validation
  body('appointment_datetime')
    .isISO8601()
    .toDate()
    .custom((value) => {
      const requestedTime = new Date(value);
      const minBookingTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      if (requestedTime <= minBookingTime) {
        throw new Error('Appointment must be at least 1 hour from now');
      }
      return true;
    })
    .isAfter(new Date(Date.now() + 60 * 60 * 1000).toISOString())
    .withMessage('Appointment must be at least 1 hour from now'),

  // appointment_type validation
  body('appointment_type')
    .optional()
    .isIn(Object.values(AppointmentType))
    .withMessage('Appointment type must be valid'),

  // notes validation
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

 /**
  * Get appointment details validation
  */
export const getAppointmentValidation = [
  param('appointment_id')
    .isUUID(4)
    .withMessage('Appointment ID must be valid UUID-4'),
];

 /**
  * Get available slots validation
  */
export const getAvailableSlotsValidation = [
  query('doctor_id')
    .isUUID(4)
    .withMessage('Doctor ID must be valid UUID-4'),

  query('date')
    .isISO8601()
    .toDate()
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();

      // Don't allow past dates
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (dateOnly < nowOnly) {
        throw new Error('Cannot get bookings for past dates');
      }

      // Don't allow more than 90 days in future
      const futureLimit = new Date();
      futureLimit.setDate(nowOnly.getDate() + 90);
      const futureLimitOnly = new Date(futureLimit.getFullYear(), futureLimit.getMonth(), futureLimit.getDate());

      if (dateOnly > futureLimitOnly) {
        throw new Error('Cannot book more than 90 days in advance');
      }

      return true;
    })
    .withMessage('Date must be valid and within booking range'),
];

 /**
  * Update appointment status validation
  */
export const updateAppointmentStatusValidation = [
  param('appointment_id')
    .isUUID(4)
    .withMessage('Appointment ID must be valid UUID-4'),

  body('status')
    .isIn(['cancelled', 'pending'])
    .withMessage('Status must be either "cancelled" or "pending"'),
];

 /**
  * Custom validator for checking if appointment slot is available
  */
export const validateAppointmentSlot = body('appointment_datetime')
  .custom(async (value) => {
    // Basic validation
    const requestedTime = new Date(value);
    if (isNaN(requestedTime.getTime())) {
      throw new Error('Invalid datetime format');
    }

    // In real implementation, this would query Cal.com API or
    // an availability service to check if slot is available

    return true;
  })
  .withMessage('Appointment datetime must be valid');

 // Appointment types configuration
export const APPOINTMENT_TYPES_CONFIG = {
  CONSULTATION: {
    value: 'consultation',
    duration: 30,
    cal_type: '30-min'
  },
  FOLLOWUP: {
    value: 'followup',
    duration: 20,
    cal_type: '30-min'
  },
  EMERGENCY: {
    value: 'emergency',
    duration: 60,
    cal_type: '60-min'
  },
  SURGERY_CONSULTATION: {
    value: 'surgery_consultation',
    duration: 45,
    cal_type: '45-min'
  },
  TELEMEDICINE: {
    value: 'telemedicine',
    duration: 30,
    cal_type: '30-min'
  },
  PRESCRIPTION_REVIEW: {
    value: 'prescription_review',
    duration: 15,
    cal_type: '30-min'
  }
};

 // Business hours configuration
export const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 18   // 6 PM
};

// Maximum future booking period (days)
export const MAX_FUTURE_BOOKING_DAYS = 60;

// Minimum advance booking time (hours)
export const MIN_ADVANCE_BOOKING_HOURS = 1;

// Default appointment number prefix
export const APPOINTMENT_NUMBER_PREFIX = 'AID';

// Default appointment duration (minutes)
export const DEFAULT_APPOINTMENT_DURATION = 30;