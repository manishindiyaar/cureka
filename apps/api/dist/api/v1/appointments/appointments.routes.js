import { Router } from 'express';
import { AppointmentsController } from './appointments.controller.js';
import { createAppointmentValidation, validateAppointmentSlot, getAvailableSlotsValidation, updateAppointmentStatusValidation, getAppointmentValidation } from './appointments.validation.js';
import { authenticateJWT, authorizePatient, authorizeAppointmentOwner } from '../../../middleware/auth.middleware.js';
const router = Router();
router.post('/', authenticateJWT, authorizePatient, createAppointmentValidation, validateAppointmentSlot, AppointmentsController.createAppointment);
router.get('/available-slots', getAvailableSlotsValidation, AppointmentsController.getAvailableSlots);
router.get('/:appointmentId', authenticateJWT, getAppointmentValidation, AppointmentsController.getAppointment);
router.patch('/:appointmentId/status', authenticateJWT, updateAppointmentStatusValidation, AppointmentsController.updateAppointmentStatus);
router.delete('/:appointmentId', authenticateJWT, authorizeAppointmentOwner, AppointmentsController.cancelAppointment);
export default router;
//# sourceMappingURL=appointments.routes.js.map