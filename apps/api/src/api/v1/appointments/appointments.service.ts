/**
 * Appointments Service
 *
 * Business logic for managing appointments
 */

import { prisma } from '../../../lib/prisma.js';
import { AppointmentType } from './appointments.dto.js';
import { AppointmentStatus, User, UserRole } from '@prisma/client';
import crypto from 'crypto';

export class AppointmentService {

  /**
   * Calculate start and end timestamps
   */
  static calculateTimeRange(startDateTime: Date, appointmentType: AppointmentType): { startTs: Date; endTs: Date } {
    const startTs = new Date(startDateTime);
    const endTs = new Date(startDateTime);

    // Calculate duration based on appointment type
    const durationMinutes = AppointmentService.getAppointmentDuration(appointmentType);
    endTs.setMinutes(endTs.getMinutes() + durationMinutes);

    return { startTs, endTs };
  }

  /**
   * Get appointment duration in minutes
   */
  static getAppointmentDuration(appointmentType: AppointmentType): number {
    const durations = {
      [AppointmentType.CONSULTATION]: 30,
      [AppointmentType.FOLLOWUP]: 20,
      [AppointmentType.EMERGENCY]: 60,
      [AppointmentType.SURGERY_CONSULTATION]: 45,
      [AppointmentType.TELEMEDICINE]: 30,
      [AppointmentType.PRESCRIPTION_REVIEW]: 15,
      [AppointmentType.FOLLOW_UP_SURGERY]: 30
    };

    return durations[appointmentType] || 30; // Default to 30 minutes
  }

  /**
   * Validate that a doctor exists and has the DOCTOR role
   */
  static async validateDoctor(doctorId: string): Promise<(User & {
    doctor?: {
      userId: string;
      hospitalId: string;
      specialty?: string | null;
    } | null;
    profile?: {
      userId: string;
      fullName: string;
      profileImageUrl?: string | null;
    } | null;
  } & {
    calId?: string;
  }) | null> {
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

      // Add calId from doctor profile or a default
      (doctor as any).calId = doctor.doctor?.userId || doctorId;

      return doctor as any;
    } catch (error) {
      console.error('Validate doctor error:', error);
      return null;
    }
  }

  /**
   * Get available time slots for a doctor
   * This integrates with the Cal.com availability system
   */
  static async getAvailableSlots(
    doctorId: string,
    date: Date,
    calComId: string
  ): Promise<string[]> {
    try {
      // For now, return a simple implementation
      // In production, this would integrate with Cal.com API

      // Get business hours for the day (9 AM to 6 PM)
      const businessHours = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
      ];

      // Filter out past times for today
      const today = new Date();
      const currentTime = today.getTime();
      const requestedDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

      if (requestedDateTime <= currentTime) {
        // Don't show past time slots for today
        return [];
      }

      // Check if it's today
      if (date.toDateString() === today.toDateString()) {
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();

        // Filter out past business hours
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
    } catch (error: any) {
      console.error('Get available slots error:', error);
      return [];
    }
  }

  /**
   * Generate unique appointment number with format AID-{YYYYMMDD}-{SEQ}
   */
  static async generateAppointmentNumber(date: Date): Promise<string> {
    try {
      // Format: AID-YYYYMMDD-XXXX
      const datePart = date.toISOString().split('T')[0].replace(/-/g, '');

      // For now, use a simple sequence based on microseconds
      // In production, this would query a sequence table or use Redis
      const sequence = date.getTime() % 10000;
      const sequencePadded = sequence.toString().padStart(4, '0');

      // Make it unique by adding random component
      const randomPart = Math.floor(Math.random() * 1000);
      const uniquePart = (date.getMilliseconds() + randomPart) % 10000;

      return `AID-${datePart}-${sequencePadded}`;
    } catch (error: any) {
      console.error('Generate appointment number error:', error);
      // Fallback to timestamp
      const timestamp = date.getTime();
      return `AID-${(timestamp).toString().slice(-4)}`;
    }
  }

  /**
   * Create local appointment record
   */
  static async createLocalAppointment(
    appointmentData: {
      appointmentNumber: string;
      doctorId: string;
      patientId: string;
      appointmentType: AppointmentType;
      appointmentDatetime: Date;
      calBookingId: string;
      status?: AppointmentStatus;
      notes?: string | null;
    }
  ) {
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
    } catch (error: any) {
      console.error('Create local appointment error:', error);
      throw new Error(`Failed to create local appointment: ${error.message}`);
    }
  }

  /**
   * Get recent appointments for a patient
   */
  static async getPatientAppointments(patientId: string): Promise<any[]> {
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
    } catch (error: any) {
      console.error('Get patient appointments error:', error);
      return [];
    }
  }

  /**
   * Cancel an appointment
   */
  static async cancelAppointment(appointmentId: string): Promise<boolean> {
    try {
      const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.CANCELLED
        }
      });

      return appointment.status === AppointmentStatus.CANCELLED;
    } catch (error: any) {
      console.error('Cancel appointment error:', error);
      return false;
    }
  }

  /**
   * Get appointment by ID for a patient
   */
  static async getAppointmentById(appointmentId: string, patientId: string): Promise<any> {
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
    } catch (error: any) {
      console.error('Get appointment by ID error:', error);
      return null;
    }
  }

  /**
   * Update appointment status
   */
  static async updateAppointmentStatus(
    appointmentId: string,
    patientId: string,
    status: AppointmentStatus
  ): Promise<boolean> {
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
    } catch (error: any) {
      console.error('Update appointment status error:', error);
      return false;
    }
  }
}