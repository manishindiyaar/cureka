import { Router } from 'express';
import { StaffController } from './staff.controller.js';
import { loginValidation, refreshTokenValidation } from './staff.validation.js';

const router: Router = Router();

// POST /api/v1/auth/staff/login
router.post('/login', loginValidation, StaffController.login);

// POST /api/v1/auth/staff/refresh
router.post('/refresh', refreshTokenValidation, StaffController.refreshToken);

export default router;