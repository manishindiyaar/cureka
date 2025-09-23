import { Router } from 'express';
import { verifyPatientOtp } from './patient.otp.verify';

const router : Router = Router();

router.post('/otp/verify', verifyPatientOtp);

export default router;