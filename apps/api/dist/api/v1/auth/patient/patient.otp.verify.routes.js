import { Router } from 'express';
import { verifyPatientOtp } from './patient.otp.verify';
const router = Router();
router.post('/otp/verify', verifyPatientOtp);
export default router;
//# sourceMappingURL=patient.otp.verify.routes.js.map