import { body } from 'express-validator';

/**
 * Validation middleware for Vapi sessions
 * Follows the pattern from patient.validation.ts
 */

export const startVapiSessionValidation = () => {
  return [
    // Assistant ID is optional - falls back to environment variable
    body('assistant_id')
      .optional()
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Assistant ID must be a valid string'),

    // Session type is optional
    body('session_type')
      .optional()
      .isIn(['appointment_booking', 'general_inquiry', 'prescription_refill'])
      .withMessage('Session type must be one of: appointment_booking, general_inquiry, prescription_refill'),

    // Patient context is optional
    body('patient_context')
      .optional()
      .isObject()
      .withMessage('Patient context must be an object'),

    // Patient ID validation
    body('patient_context.patient_id')
      .optional()
      .isString()
      .isLength({ min: 1 })
      .withMessage('Patient ID must be a valid string'),
  ];
};