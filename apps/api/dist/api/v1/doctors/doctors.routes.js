import { Router } from 'express';
import { DoctorsController } from './doctors.controller.js';
import { createDoctorValidation } from './doctors.validation.js';
const router = Router();
router.post('/', createDoctorValidation, DoctorsController.createDoctor);
router.get('/:id', DoctorsController.getDoctor);
export default router;
//# sourceMappingURL=doctors.routes.js.map