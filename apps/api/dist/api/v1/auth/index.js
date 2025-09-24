import { Router } from 'express';
import patientAuthRoutes from './patient/patient.routes.js';
import staffAuthRoutes from './staff/staff.routes.js';
const router = Router();
router.use('/patient', patientAuthRoutes);
router.use('/staff', staffAuthRoutes);
export default router;
//# sourceMappingURL=index.js.map