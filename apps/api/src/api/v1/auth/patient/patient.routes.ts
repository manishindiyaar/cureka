import { Router } from 'express';
import { requestOtp, verifyOtp, otpRateLimit } from './patient.controller.js';
import { requestOtpValidation, verifyOtpValidation } from './patient.validation.js';
import { OtpVerifyController } from './otp-verify.controller.js';

const router: Router = Router();

// POST /api/v1/auth/patient/otp/request
router.post('/otp/request',
  otpRateLimit,
  requestOtpValidation,
  requestOtp
);

// POST /api/v1/auth/patient/otp/verify
router.post('/otp/verify',
  verifyOtpValidation,
  OtpVerifyController.verifyOtp
);

export default router;