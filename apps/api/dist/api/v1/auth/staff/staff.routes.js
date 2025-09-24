import { Router } from 'express';
import { StaffController } from './staff.controller.js';
import { loginValidation, refreshTokenValidation } from './staff.validation.js';
const router = Router();
router.post('/login', loginValidation, StaffController.login);
router.post('/refresh', refreshTokenValidation, StaffController.refreshToken);
export default router;
//# sourceMappingURL=staff.routes.js.map