import { prisma } from '../../../lib/prisma.js';
import { PasswordService } from '../../../services/password.service.js';
export class HospitalsService {
    static async generateTemporaryPassword(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
    static async createHospitalAndAdmin(hospitalData) {
        const emailParts = hospitalData.admin_email.split('@');
        const domainParts = emailParts[1].split('.');
        const hospitalNameFromEmail = domainParts[0];
        if (hospitalData.hospital_name.toLowerCase().replace(/\s+/g, '-') !== hospitalNameFromEmail) {
            throw new Error('HOSPITAL_NAME_MISMATCH');
        }
        const existingHospital = await prisma.hospital.findFirst({
            where: {
                name: {
                    equals: hospitalData.hospital_name,
                    mode: 'insensitive'
                }
            }
        });
        if (existingHospital) {
            throw new Error('HOSPITAL_NAME_EXISTS');
        }
        const existingUser = await prisma.user.findUnique({
            where: { email: hospitalData.admin_email }
        });
        if (existingUser) {
            throw new Error('ADMIN_EMAIL_EXISTS');
        }
        const tempPassword = await this.generateTemporaryPassword(16);
        const passwordHash = await PasswordService.hashPassword(tempPassword);
        const result = await prisma.$transaction(async (prisma) => {
            const hospital = await prisma.hospital.create({
                data: {
                    name: hospitalData.hospital_name
                }
            });
            const user = await prisma.user.create({
                data: {
                    id: crypto.randomUUID(),
                    email: hospitalData.admin_email,
                    passwordHash: passwordHash,
                    role: 'HOSPITAL_ADMIN',
                    hospitalId: hospital.id,
                    forcePasswordChange: true,
                    passwordTemp: true,
                    profile: {
                        create: {
                            fullName: hospitalData.admin_full_name
                        }
                    },
                    hospitalAdmin: {
                        create: {
                            hospitalId: hospital.id
                        }
                    }
                },
                include: {
                    profile: true,
                    hospitalAdmin: true
                }
            });
            return { hospital, user };
        });
        return {
            hospital: {
                id: result.hospital.id,
                name: result.hospital.name,
                created_at: result.hospital.createdAt.toISOString()
            },
            admin: {
                user_id: result.user.id,
                email: result.user.email,
                full_name: result.user.profile?.fullName,
                role: result.user.role,
                hospital_id: result.user.hospitalId,
                permissions: [
                    'manage_staff',
                    'view_hospital_data',
                    'manage_settings',
                    'view_reports'
                ],
                requires_first_login: true
            },
            temporary_password: tempPassword
        };
    }
    static async getHospitalById(hospitalId) {
        const hospital = await prisma.hospital.findUnique({
            where: { id: hospitalId }
        });
        if (!hospital) {
            throw new Error('HOSPITAL_NOT_FOUND');
        }
        return {
            id: hospital.id,
            name: hospital.name,
            created_at: hospital.createdAt.toISOString()
        };
    }
}
//# sourceMappingURL=hospitals.service.js.map