import { body } from 'express-validator';

export const APPROVED_SPECIALTIES = [
  'General Medicine',
  'Cardiology',
  'Internal Medicine',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Dermatology',
  'Orthopedics',
  'Ophthalmology',
  'ENT',
  'Surgery',
  'Neurology',
  'Psychiatry',
  'Radiology',
  'Anesthesiology'
];

export const createDoctorValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .matches(/^[^@\s]+@([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)\.curekahealth\.com$/)
    .withMessage('Email must use {hospital}.curekahealth.com domain'),
  body('full_name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  body('specialty')
    .isIn(APPROVED_SPECIALTIES)
    .withMessage('Specialty must be from approved list'),
  body('hospital_id')
    .isUUID()
    .withMessage('Hospital ID must be a valid UUID')
];