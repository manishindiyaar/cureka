import { body, param, query } from 'express-validator';
import { AppointmentType } from './appointments.dto.js';
export const createAppointmentValidation = [
    body('doctor_id')
        .isUUID(4)
        .withMessage('Doctor ID must be valid UUID-4'),
    body('appointment_datetime')
        .isISO8601()
        .toDate()
        .custom((value) => {
        const requestedTime = new Date(value);
        const minBookingTime = new Date(Date.now() + 60 * 60 * 1000);
        if (requestedTime <= minBookingTime) {
            throw new Error('Appointment must be at least 1 hour from now');
        }
        return true;
    })
        .isAfter(new Date(Date.now() + 60 * 60 * 1000).toISOString())
        .withMessage('Appointment must be at least 1 hour from now'),
    body('appointment_type')
        .optional()
        .isIn(Object.values(AppointmentType))
        .withMessage('Appointment type must be valid'),
    body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes cannot exceed 500 characters'),
];
export const getAppointmentValidation = [
    param('appointment_id')
        .isUUID(4)
        .withMessage('Appointment ID must be valid UUID-4'),
];
export const getAvailableSlotsValidation = [
    query('doctor_id')
        .isUUID(4)
        .withMessage('Doctor ID must be valid UUID-4'),
    query('date')
        .isISO8601()
        .toDate()
        .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateOnly < nowOnly) {
            throw new Error('Cannot get bookings for past dates');
        }
        const futureLimit = new Date();
        futureLimit.setDate(nowOnly.getDate() + 90);
        const futureLimitOnly = new Date(futureLimit.getFullYear(), futureLimit.getMonth(), futureLimit.getDate());
        if (dateOnly > futureLimitOnly) {
            throw new Error('Cannot book more than 90 days in advance');
        }
        return true;
    })
        .withMessage('Date must be valid and within booking range'),
];
export const updateAppointmentStatusValidation = [
    param('appointment_id')
        .isUUID(4)
        .withMessage('Appointment ID must be valid UUID-4'),
    body('status')
        .isIn(['cancelled', 'pending'])
        .withMessage('Status must be either "cancelled" or "pending"'),
];
export const validateAppointmentSlot = body('appointment_datetime')
    .custom(async (value) => {
    const requestedTime = new Date(value);
    if (isNaN(requestedTime.getTime())) {
        throw new Error('Invalid datetime format');
    }
    return true;
})
    .withMessage('Appointment datetime must be valid');
export const APPOINTMENT_TYPES_CONFIG = {
    CONSULTATION: {
        value: 'consultation',
        duration: 30,
        cal_type: '30-min'
    },
    FOLLOWUP: {
        value: 'followup',
        duration: 20,
        cal_type: '30-min'
    },
    EMERGENCY: {
        value: 'emergency',
        duration: 60,
        cal_type: '60-min'
    },
    SURGERY_CONSULTATION: {
        value: 'surgery_consultation',
        duration: 45,
        cal_type: '45-min'
    },
    TELEMEDICINE: {
        value: 'telemedicine',
        duration: 30,
        cal_type: '30-min'
    },
    PRESCRIPTION_REVIEW: {
        value: 'prescription_review',
        duration: 15,
        cal_type: '30-min'
    }
};
export const BUSINESS_HOURS = {
    start: 9,
    end: 18
};
export const MAX_FUTURE_BOOKING_DAYS = 60;
export const MIN_ADVANCE_BOOKING_HOURS = 1;
export const APPOINTMENT_NUMBER_PREFIX = 'AID';
export const DEFAULT_APPOINTMENT_DURATION = 30;
//# sourceMappingURL=appointments.validation.js.map