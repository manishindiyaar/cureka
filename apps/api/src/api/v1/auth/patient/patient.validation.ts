import { body } from 'express-validator';

export const requestOtpValidation = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('any', { strictMode: true })
    .withMessage('Phone number must be in E.164 format')
    .custom((value) => {
      // Check if it's an Indian number (+91 prefix)
      if (!value.startsWith('+91')) {
        throw new Error('Phone number must be an Indian number starting with +91');
      }
      // Validate the Indian phone number format (10 digits after +91)
      const indianNumberPattern = /^\+91[1-9]\d{9}$/;
      if (!indianNumberPattern.test(value)) {
        throw new Error('Invalid Indian phone number format');
      }
      return true;
    })
];

export const verifyOtpValidation = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('any', { strictMode: true })
    .withMessage('Phone number must be in E.164 format')
    .custom((value) => {
      if (!value.startsWith('+91')) {
        throw new Error('Phone number must be an Indian number starting with +91');
      }
      const indianNumberPattern = /^\+91[1-9]\d{9}$/;
      if (!indianNumberPattern.test(value)) {
        throw new Error('Invalid Indian phone number format');
      }
      return true;
    }),
  body('otp_code')
    .notEmpty()
    .withMessage('OTP code is required')
    .isLength({ min: 4, max: 4 })
    .withMessage('OTP must be 4 digits')
    .isNumeric()
    .withMessage('OTP must be numeric')
];