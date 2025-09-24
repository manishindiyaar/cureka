import { AppointmentType } from './appointments.dto.js';
import { AppointmentStatus, User } from '@prisma/client';
export declare class AppointmentService {
    static calculateTimeRange(startDateTime: Date, appointmentType: AppointmentType): {
        startTs: Date;
        endTs: Date;
    };
    static getAppointmentDuration(appointmentType: AppointmentType): number;
    static validateDoctor(doctorId: string): Promise<(User & {
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
    }) | null>;
    static getAvailableSlots(doctorId: string, date: Date, calComId: string): Promise<string[]>;
    static generateAppointmentNumber(date: Date): Promise<string>;
    static createLocalAppointment(appointmentData: {
        appointmentNumber: string;
        doctorId: string;
        patientId: string;
        appointmentType: AppointmentType;
        appointmentDatetime: Date;
        calBookingId: string;
        status?: AppointmentStatus;
        notes?: string | null;
    }): Promise<{
        createdAt: Date;
        id: string;
        calBookingId: string;
        patientId: string | null;
        doctorId: string;
        startTs: Date;
        endTs: Date;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        calRawPayload: import("@prisma/client/runtime/library.js").JsonValue | null;
        lastSyncedAt: Date | null;
    }>;
    static getPatientAppointments(patientId: string): Promise<any[]>;
    static cancelAppointment(appointmentId: string): Promise<boolean>;
    static getAppointmentById(appointmentId: string, patientId: string): Promise<any>;
    static updateAppointmentStatus(appointmentId: string, patientId: string, status: AppointmentStatus): Promise<boolean>;
}
//# sourceMappingURL=appointments.service.d.ts.map