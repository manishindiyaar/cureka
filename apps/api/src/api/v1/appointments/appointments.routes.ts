/**
 * Appointments Routes
 *
 * Defines all appointment-related API endpoints and handles routing
 */

import { Router } from 'express';
import { AppointmentsController } from './appointments.controller.js';
import {
  createAppointmentValidation,
  validateAppointmentSlot,
  getAvailableSlotsValidation,
  updateAppointmentStatusValidation,
  getAppointmentValidation
} from './appointments.validation.js';
import { authenticateJWT, authorizePatient, authorizeAppointmentOwner } from '../../../middleware/auth.middleware.js';

const router: Router = Router();

// Create new appointment
// POST /api/v1/appointments
router.post('/', authenticateJWT, authorizePatient, createAppointmentValidation, validateAppointmentSlot, AppointmentsController.createAppointment);

// Get available time slots for a doctor
// GET /api/v1/appointments/available-slots
router.get('/available-slots', getAvailableSlotsValidation, AppointmentsController.getAvailableSlots);

// Get appointment details
// GET /api/v1/appointments/:appointment_id
router.get('/:appointmentId', authenticateJWT, getAppointmentValidation, AppointmentsController.getAppointment);

// Update appointment status
// PATCH /api/v1/appointments/:appointment_id/status
router.patch('/:appointmentId/status', authenticateJWT, updateAppointmentStatusValidation, AppointmentsController.updateAppointmentStatus);

// Cancel appointment
// DELETE /api/v1/appointments/:appointment_id
router.delete('/:appointmentId', authenticateJWT, authorizeAppointmentOwner, AppointmentsController.cancelAppointment);

export default router;

// Authentication and authorization middleware functions (to be imported from auth middleware)