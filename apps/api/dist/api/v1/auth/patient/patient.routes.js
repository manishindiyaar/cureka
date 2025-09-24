import { Router } from 'express';
import { requestOtp, otpRateLimit } from './patient.controller.js';
import { requestOtpValidation, verifyOtpValidation } from './patient.validation.js';
import { OtpVerifyController } from './otp-verify.controller.js';
const router = Router();
router.post('/otp/request', otpRateLimit, requestOtpValidation, requestOtp);
router.post('/otp/verify', verifyOtpValidation, OtpVerifyController.verifyOtp);
export default router;
//# sourceMappingURL=patient.routes.js.map