import { validationResult } from 'express-validator';
import { AppointmentService } from './appointments.service.js';
import { AppointmentStatus, AppointmentType, APPOINTMENT_DURATIONS } from './appointments.dto.js';
import { CalComService } from '../../../services/calcom.service.js';
const CAL_COM_API_KEY = process.env.CAL_COM_API_KEY || 'your_cal_com_api_key';
const CAL_COM_BASE_URL = process.env.CAL_COM_BASE_URL || 'https://api.cal.com/v1';
const calComService = new CalComService(CAL_COM_API_KEY, CAL_COM_BASE_URL);
export class AppointmentsController {
    static async createAppointment(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    errors: errors.array()
                });
            }
            const { doctor_id, appointment_datetime, appointment_type, notes } = req.body;
            const patientId = req.user?.userId;
            const minBookingTime = new Date(Date.now() + 60 * 60 * 1000);
            const requestedTime = new Date(appointment_datetime);
            if (requestedTime <= minBookingTime) {
                return res.status(400).json({
                    success: false,
                    code: 'PAST_DATETIME',
                    message: 'Appointment must be at least 1 hour from now'
                });
            }
            const doctor = await AppointmentService.validateDoctor(doctor_id);
            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    code: 'DOCTOR_NOT_FOUND',
                    message: 'Doctor not found or inactive'
                });
            }
            const appointmentNumber = await AppointmentService.generateAppointmentNumber(requestedTime);
            const checkAvailability = await calComService.checkDoctorAvailability(doctor_id, requestedTime);
            if (!checkAvailability) {
                return res.status(409).json({
                    success: false,
                    code: 'SLOT_UNAVAILABLE',
                    message: 'Selected time slot is not available',
                    details: {
                        requested_time: requestedTime.toISOString(),
                        doctor_id: doctor_id
                    }
                });
            }
            const appointmentType = (appointment_type || AppointmentType.CONSULTATION);
            const appointmentDuration = APPOINTMENT_DURATIONS[appointmentType];
            const calBookingRequest = {
                type: 'medical-consultation',
                datetime: requestedTime,
                doctor_cal_com_id: doctor.calId,
                appointment_number: appointmentNumber,
                doctor_id: doctor_id,
                patient_id: patientId,
                notes: notes
            };
            let calBookingResponse;
            try {
                calBookingResponse = await calComService.createBooking(calBookingRequest);
            }
            catch (calError) {
                console.error('Cal.com booking failed:', calError.message);
                return res.status(503).json({
                    success: false,
                    code: 'CAL_COM_ERROR',
                    message: 'Calendar service is temporarily unavailable'
                });
            }
            const appointment = await AppointmentService.createLocalAppointment({
                appointmentNumber,
                doctorId: doctor_id,
                patientId: patientId,
                appointmentType: appointment_type || AppointmentType.CONSULTATION,
                appointmentDatetime: requestedTime,
                calBookingId: calBookingResponse.booking_id,
                status: AppointmentStatus.SCHEDULED,
                notes: notes ?? null
            });
            return res.status(201).json({
                success: true,
                data: {
                    appointment_id: appointment.id,
                    cal_booking_id: appointment.calBookingId,
                    doctor: {
                        doctor_id: doctor_id,
                        name: doctor.profile?.fullName || 'Doctor',
                        specialty: doctor.doctor?.specialty || 'General Medicine'
                    },
                    patient: {
                        patient_id: patientId,
                        name: req.user?.fullName || 'Patient'
                    },
                    appointment_details: {
                        datetime: requestedTime.toISOString(),
                        duration_minutes: appointmentDuration,
                        appointment_type: appointment_type || AppointmentType.CONSULTATION,
                        status: AppointmentStatus.SCHEDULED,
                        appointment_number: appointmentNumber
                    },
                    meeting_links: {
                        video_conference_url: calBookingResponse.meeting_url || '',
                        cal_event_link: calBookingResponse.confirm_link || ''
                    }
                }
            });
        }
        catch (error) {
            console.error('Create appointment error:', error);
            if (error.message === 'SLOT_UNAVAILABLE') {
                return res.status(409).json({
                    success: false,
                    code: 'SLOT_UNAVAILABLE',
                    message: 'Selected time slot is not available'
                });
            }
            if (error.message === 'CAL_COM_BOOKING_FAILED') {
                return res.status(503).json({
                    success: false,
                    code: 'CAL_COM_ERROR',
                    message: 'Calendar service is temporarily unavailable'
                });
            }
            return res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to create appointment'
            });
        }
    }
    static async getAvailableSlots(req, res) {
        try {
            const { doctor_id, date } = req.query;
            if (!doctor_id || !date) {
                return res.status(400).json({
                    success: false,
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'doctor_id and date are required'
                });
            }
            const requestedDate = new Date(date);
            const requestedDoctorId = doctor_id;
            const doctor = await AppointmentService.validateDoctor(requestedDoctorId);
            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    code: 'DOCTOR_NOT_FOUND',
                    message: 'Doctor not found'
                });
            }
            const slots = await AppointmentService.getAvailableSlots(requestedDoctorId, requestedDate, doctor.calId);
            return res.status(200).json({
                success: true,
                data: {
                    doctor_id: requestedDoctorId,
                    date: requestedDate.toISOString().split('T')[0],
                    available_slots: slots,
                    doctor_name: doctor.profile?.fullName || 'Doctor',
                    specialty: doctor.doctor?.specialty || 'General Medicine'
                }
            });
        }
        catch (error) {
            console.error('Get available slots error:', error);
            return res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to get available slots'
            });
        }
    }
    static async getAppointment(req, res) {
        try {
            const { appointmentId } = req.params;
            const userId = req.user?.userId;
            const appointment = await AppointmentService.getAppointmentById(appointmentId, userId);
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    code: 'APPOINTMENT_NOT_FOUND',
                    message: 'Appointment not found or you do not have permission to access it'
                });
            }
            return res.status(200).json({
                success: true,
                data: appointment
            });
        }
        catch (error) {
            console.error('Get appointment error:', error);
            return res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to get appointment details'
            });
        }
    }
    static async updateAppointmentStatus(req, res) {
        try {
            const { appointmentId } = req.params;
            const { status } = req.body;
            const userId = req.user?.userId;
            const updated = await AppointmentService.updateAppointmentStatus(appointmentId, userId, status);
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    code: 'APPOINTMENT_NOT_FOUND',
                    message: 'Appointment not found or you do not have permission to update it'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Appointment status updated successfully',
                data: { id: appointmentId, status }
            });
        }
        catch (error) {
            console.error('Update appointment status error:', error);
            return res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to update appointment status'
            });
        }
    }
    static async cancelAppointment(req, res) {
        try {
            const { appointmentId } = req.params;
            const cancelled = await AppointmentService.cancelAppointment(appointmentId);
            if (!cancelled) {
                return res.status(404).json({
                    success: false,
                    code: 'APPOINTMENT_NOT_FOUND',
                    message: 'Appointment not found or already cancelled'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Appointment cancelled successfully'
            });
        }
        catch (error) {
            console.error('Cancel appointment error:', error);
            return res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to cancel appointment'
            });
        }
    }
}
//# sourceMappingURL=appointments.controller.js.map