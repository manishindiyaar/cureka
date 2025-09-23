import { Router } from 'express';
import { DoctorsController } from './doctors.controller.js';
import { createDoctorValidation } from './doctors.validation.js';

const router: Router = Router();

// POST /api/v1/doctors
router.post('/', createDoctorValidation, DoctorsController.createDoctor);

// GET /api/v1/doctors/:id
router.get('/:id', DoctorsController.getDoctor);

export default router;