import { Router } from 'express';
import { authenticateJWT, authorizeHospitalAdmin } from '../../../middleware/auth.middleware.js';
import { HospitalsController } from './hospitals.controller.js';
import { HospitalsDashboardController } from './hospitals-dashboard.controller.js';
import { createHospitalValidation } from './hospitals.validation.js';
const router = Router();
router.post('/', createHospitalValidation, HospitalsController.createHospital);
router.get('/:id', HospitalsController.getHospital);
router.get('/dashboard/overview', authenticateJWT, authorizeHospitalAdmin, HospitalsDashboardController.getDashboardOverview);
router.get('/dashboard/staff', authenticateJWT, authorizeHospitalAdmin, HospitalsDashboardController.getStaffList);
router.post('/dashboard/doctors', authenticateJWT, authorizeHospitalAdmin, HospitalsDashboardController.addDoctor);
export default router;
//# sourceMappingURL=hospitals.routes.js.map