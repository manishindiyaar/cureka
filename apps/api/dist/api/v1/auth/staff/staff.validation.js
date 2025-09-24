import { body } from 'express-validator';
export const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 1 })
        .withMessage('Password is required')
];
export const refreshTokenValidation = [
    body('refresh_token')
        .isLength({ min: 1 })
        .withMessage('Refresh token is required')
];
//# sourceMappingURL=staff.validation.js.map