import { body } from 'express-validator';
export const createHospitalValidation = [
    body('hospital_name')
        .isLength({ min: 3, max: 100 })
        .withMessage('Hospital name must be between 3 and 100 characters'),
    body('admin_email')
        .isEmail()
        .normalizeEmail()
        .matches(/^admin@([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)\.curekahealth\.in$/)
        .withMessage('Admin email must follow format: admin@{hospital}.curekahealth.in'),
    body('admin_full_name')
        .isLength({ min: 2, max: 50 })
        .withMessage('Admin full name must be between 2 and 50 characters')
];
//# sourceMappingURL=hospitals.validation.js.map