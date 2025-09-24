import { prisma } from '../../../lib/prisma.js';
import { PasswordService } from '../../../services/password.service.js';
import crypto from 'crypto';
export class DoctorsService {
    static async generateTemporaryPassword(length = 12) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
    static async createDoctor(hospitalAdminId, doctorData) {
        const adminUser = await prisma.user.findUnique({
            where: { id: hospitalAdminId },
            include: { hospitalAdmin: true }
        });
        if (!adminUser || adminUser.role !== 'HOSPITAL_ADMIN' || !adminUser.hospitalAdmin) {
            throw new Error('INSUFFICIENT_PERMISSIONS');
        }
        const existingUser = await prisma.user.findUnique({
            where: { email: doctorData.email }
        });
        if (existingUser) {
            throw new Error('EMAIL_EXISTS');
        }
        const hospital = await prisma.hospital.findUnique({
            where: { id: doctorData.hospital_id }
        });
        if (!hospital) {
            throw new Error('HOSPITAL_NOT_FOUND');
        }
        if (hospital.id !== adminUser.hospitalAdmin.hospitalId) {
            throw new Error('HOSPITAL_MISMATCH');
        }
        const emailParts = doctorData.email.split('@');
        const domainParts = emailParts[1].split('.');
        const hospitalNameFromEmail = domainParts[0];
        if (hospital.name.toLowerCase().replace(/\s+/g, '-') !== hospitalNameFromEmail) {
            throw new Error('EMAIL_DOMAIN_MISMATCH');
        }
        const tempPassword = await this.generateTemporaryPassword(12);
        const passwordHash = await PasswordService.hashPassword(tempPassword);
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    id: crypto.randomUUID(),
                    email: doctorData.email,
                    passwordHash: passwordHash,
                    role: 'DOCTOR',
                    hospitalId: doctorData.hospital_id,
                    forcePasswordChange: true,
                    passwordTemp: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    profile: {
                        create: {
                            fullName: doctorData.full_name
                        }
                    },
                    doctor: {
                        create: {
                            hospitalId: doctorData.hospital_id,
                            specialty: doctorData.specialty
                        }
                    }
                },
                include: {
                    profile: true,
                    doctor: true
                }
            });
            return user;
        });
        return {
            user_id: result.id,
            email: result.email || '',
            full_name: 'Dr. ' + doctorData.full_name,
            specialty: doctorData.specialty,
            hospital_id: result.hospitalId || null,
            created_at: result.createdAt.toISOString(),
            role: result.role,
            permissions: [
                'read_patients',
                'write_prescriptions',
                'manage_schedule',
                'view_insights'
            ],
            requires_first_login: true
        };
    }
    static async getDoctorById(doctorId) {
        const user = await prisma.user.findUnique({
            where: { id: doctorId },
            include: {
                profile: true,
                doctor: true,
                hospital: true
            }
        });
        if (!user || user.role !== 'DOCTOR') {
            throw new Error('DOCTOR_NOT_FOUND');
        }
        return {
            user_id: user.id,
            email: user.email || '',
            full_name: user.profile?.fullName || null,
            specialty: user.doctor?.specialty || null,
            hospital_id: user.hospitalId || null,
            created_at: user.createdAt.toISOString(),
            role: user.role,
            permissions: [
                'read_patients',
                'write_prescriptions',
                'manage_schedule',
                'view_insights'
            ]
        };
    }
}
//# sourceMappingURL=doctors.service.js.map