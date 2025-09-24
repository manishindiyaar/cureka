import { prisma } from '../../../lib/prisma.js';
import { AppointmentType } from './appointments.dto.js';
import { AppointmentStatus, UserRole } from '@prisma/client';
import crypto from 'crypto';
export class AppointmentService {
    static calculateTimeRange(startDateTime, appointmentType) {
        const startTs = new Date(startDateTime);
        const endTs = new Date(startDateTime);
        const durationMinutes = AppointmentService.getAppointmentDuration(appointmentType);
        endTs.setMinutes(endTs.getMinutes() + durationMinutes);
        return { startTs, endTs };
    }
    static getAppointmentDuration(appointmentType) {
        const durations = {
            [AppointmentType.CONSULTATION]: 30,
            [AppointmentType.FOLLOWUP]: 20,
            [AppointmentType.EMERGENCY]: 60,
            [AppointmentType.SURGERY_CONSULTATION]: 45,
            [AppointmentType.TELEMEDICINE]: 30,
            [AppointmentType.PRESCRIPTION_REVIEW]: 15,
            [AppointmentType.FOLLOW_UP_SURGERY]: 30
        };
        return durations[appointmentType] || 30;
    }
    static async validateDoctor(doctorId) {
        try {
            const doctor = await prisma.user.findUnique({
                where: { id: doctorId },
                include: {
                    doctor: true,
                    profile: true
                }
            });
            if (!doctor || doctor.role !== UserRole.DOCTOR) {
                return null;
            }
            doctor.calId = doctor.doctor?.userId || doctorId;
            return doctor;
        }
        catch (error) {
            console.error('Validate doctor error:', error);
            return null;
        }
    }
    static async getAvailableSlots(doctorId, date, calComId) {
        try {
            const businessHours = [
                '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
            ];
            const today = new Date();
            const currentTime = today.getTime();
            const requestedDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
            if (requestedDateTime <= currentTime) {
                return [];
            }
            if (date.toDateString() === today.toDateString()) {
                const currentHour = today.getHours();
                const currentMinute = today.getMinutes();
                return businessHours.filter(time => {
                    const [hour, minute] = time.split(':');
                    const timeHour = parseInt(hour);
                    const timeMinute = parseInt(minute);
                    if (timeHour < currentHour ||
                        (timeHour === currentHour && timeMinute <= currentMinute)) {
                        return false;
                    }
                    return true;
                });
            }
            return businessHours;
        }
        catch (error) {
            console.error('Get available slots error:', error);
            return [];
        }
    }
    static async generateAppointmentNumber(date) {
        try {
            const datePart = date.toISOString().split('T')[0].replace(/-/g, '');
            const sequence = date.getTime() % 10000;
            const sequencePadded = sequence.toString().padStart(4, '0');
            const randomPart = Math.floor(Math.random() * 1000);
            const uniquePart = (date.getMilliseconds() + randomPart) % 10000;
            return `AID-${datePart}-${sequencePadded}`;
        }
        catch (error) {
            console.error('Generate appointment number error:', error);
            const timestamp = date.getTime();
            return `AID-${(timestamp).toString().slice(-4)}`;
        }
    }
    static async createLocalAppointment(appointmentData) {
        try {
            const { startTs, endTs } = this.calculateTimeRange(appointmentData.appointmentDatetime, appointmentData.appointmentType);
            const appointment = await prisma.appointment.create({
                data: {
                    id: crypto.randomUUID(),
                    calBookingId: appointmentData.calBookingId,
                    patientId: appointmentData.patientId,
                    doctorId: appointmentData.doctorId,
                    startTs: startTs,
                    endTs: endTs,
                    status: appointmentData.status || AppointmentStatus.SCHEDULED
                }
            });
            return appointment;
        }
        catch (error) {
            console.error('Create local appointment error:', error);
            throw new Error(`Failed to create local appointment: ${error.message}`);
        }
    }
    static async getPatientAppointments(patientId) {
        try {
            const appointments = await prisma.appointment.findMany({
                where: {
                    patientId: patientId
                },
                include: {
                    doctor: true
                },
                orderBy: {
                    startTs: 'desc'
                },
                take: 10
            });
            return appointments;
        }
        catch (error) {
            console.error('Get patient appointments error:', error);
            return [];
        }
    }
    static async cancelAppointment(appointmentId) {
        try {
            const appointment = await prisma.appointment.update({
                where: { id: appointmentId },
                data: {
                    status: AppointmentStatus.CANCELLED
                }
            });
            return appointment.status === AppointmentStatus.CANCELLED;
        }
        catch (error) {
            console.error('Cancel appointment error:', error);
            return false;
        }
    }
    static async getAppointmentById(appointmentId, patientId) {
        try {
            const appointment = await prisma.appointment.findUnique({
                where: {
                    id: appointmentId,
                    patientId: patientId
                },
                include: {
                    doctor: true
                }
            });
            return appointment;
        }
        catch (error) {
            console.error('Get appointment by ID error:', error);
            return null;
        }
    }
    static async updateAppointmentStatus(appointmentId, patientId, status) {
        try {
            await prisma.appointment.update({
                where: {
                    id: appointmentId,
                    patientId: patientId
                },
                data: {
                    status: status
                }
            });
            return true;
        }
        catch (error) {
            console.error('Update appointment status error:', error);
            return false;
        }
    }
}
//# sourceMappingURL=appointments.service.js.map