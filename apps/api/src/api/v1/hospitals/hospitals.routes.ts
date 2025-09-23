import { Router } from 'express';
import { HospitalsController } from './hospitals.controller.js';
import { createHospitalValidation } from './hospitals.validation.js';

const router: Router = Router();

// POST /api/v1/hospitals
router.post('/', createHospitalValidation, HospitalsController.createHospital);

// GET /api/v1/hospitals/:id
router.get('/:id', HospitalsController.getHospital);

export default router;