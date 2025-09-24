import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateJWT, authorizeHospitalAdmin } from '../../../middleware/auth.middleware.js';
import { HospitalsController } from './hospitals.controller.js';
import { HospitalsDashboardController } from './hospitals-dashboard.controller.js';
import { createHospitalValidation } from './hospitals.validation.js';

const router: Router = Router();

// Hospital management (system admin only)
// POST /api/v1/hospitals
router.post('/', createHospitalValidation, HospitalsController.createHospital);

// GET /api/v1/hospitals/:id
router.get('/:id', HospitalsController.getHospital);

// Hospital Dashboard (hospital admin only)
// GET /api/v1/hospitals/dashboard/overview
router.get('/dashboard/overview', authenticateJWT, authorizeHospitalAdmin, HospitalsDashboardController.getDashboardOverview);

// GET /api/v1/hospitals/dashboard/staff
router.get('/dashboard/staff', authenticateJWT, authorizeHospitalAdmin, HospitalsDashboardController.getStaffList);

// POST /api/v1/hospitals/dashboard/doctors
router.post('/dashboard/doctors', authenticateJWT, authorizeHospitalAdmin, HospitalsDashboardController.addDoctor);

export default router;