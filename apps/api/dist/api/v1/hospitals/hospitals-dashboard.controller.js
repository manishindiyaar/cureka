import { prisma } from '../../../lib/prisma.js';
export class HospitalsDashboardController {
    static async getDashboardOverview(req, res) {
        try {
            const userId = req.user?.userId;
            const hospital = await prisma.hospital.findUnique({
                where: {
                    id: await HospitalsDashboardController.getUserHospitalId(userId)
                },
                include: {
                    users: {
                        where: {
                            role: { in: ['HOSPITAL_ADMIN', 'DOCTOR', 'PHARMACIST'] }
                        },
                        select: {
                            id: true,
                            email: true,
                            role: true,
                            createdAt: true
                        }
                    }
                }
            });
            if (!hospital) {
                return res.status(404).json({
                    success: false,
                    code: 'HOSPITAL_NOT_FOUND',
                    message: 'Hospital not found'
                });
            }
            const staffCounts = {
                ADMIN: hospital.users.filter((u) => u.role === 'HOSPITAL_ADMIN').length,
                DOCTOR: hospital.users.filter((u) => u.role === 'DOCTOR').length,
                PHARMACIST: hospital.users.filter((u) => u.role === 'PHARMACIST').length,
                TOTAL: hospital.users.length
            };
            return res.status(200).json({
                success: true,
                data: {
                    hospital: {
                        id: hospital.id,
                        name: hospital.name,
                        created_at: hospital.createdAt
                    },
                    stats: {
                        total_staff: staffCounts.TOTAL,
                        admin: staffCounts.ADMIN,
                        doctors: staffCounts.DOCTOR,
                        pharmacists: staffCounts.PHARMACIST
                    }
                }
            });
        }
        catch (error) {
            console.error('Dashboard overview error:', error);
            return res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to get dashboard overview'
            });
        }
    }
    static async getStaffList(req, res) {
        try {
            const userId = req.user?.userId;
            const { role } = req.query;
            const hospitalId = await HospitalsDashboardController.getUserHospitalId(userId);
            const whereClause = {
                hospitalId: hospitalId,
                role: { in: ['DOCTOR', 'PHARMACIST'] }
            };
            if (role && ['DOCTOR', 'PHARMACIST'].includes(role)) {
                whereClause.role = role;
            }
            const staff = await prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    passwordTemp: true,
                    createdAt: true,
                    profile: {
                        select: {
                            fullName: true
                        }
                    },
                    doctor: true,
                    pharmacist: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return res.status(200).json({
                success: true,
                data: {
                    staff: staff.map((user) => ({
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        is_active: user.passwordTemp || false,
                        created_at: user.createdAt,
                        full_name: user.profile?.fullName || null,
                        specialization: user.role === 'DOCTOR' ? user.doctor?.specialty : null,
                        phone_number: user.doctor?.phone || user.pharmacist?.phone || null
                    })),
                    total: staff.length,
                    role: role || 'all'
                }
            });
        }
        catch (error) {
            console.error('Get staff list error:', error);
            return res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to get staff list'
            });
        }
    }
    static async addDoctor(req, res) {
        try {
            const userId = req.user?.userId;
            const { first_name, last_name, specialization, license_number, email, phone, gender, date_of_birth, hospital_id, full_name } = req.body;
            const adminHospitalId = await HospitalsDashboardController.getUserHospitalId(userId);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    errors: errors.array()
                });
            }
            const tempPassword = await HospitalsDashboardController.generateTemporaryPassword(12);
            const passwordHash = await PasswordService.hashPassword(tempPassword);
            const doctor = await prisma.$transaction(async (tx) => {
                return await tx.user.create({
                    data: {
                        id: crypto.randomUUID(),
                        email: email,
                        passwordHash: passwordHash,
                        role: 'DOCTOR',
                        hospitalId: adminHospitalId,
                        forcePasswordChange: true,
                        passwordTemp: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        profile: {
                            create: {
                                fullName: full_name || `${first_name} ${last_name}`
                            }
                        },
                        doctor: {
                            create: {
                                hospitalId: adminHospitalId,
                                specialty: specialization
                            }
                        }
                    },
                    include: {
                        profile: true,
                        doctor: true
                    }
                });
            });
            return res.status(201).json({
                success: true,
                data: {
                    user_id: doctor.id,
                    email: doctor.email,
                    full_name: doctor.profile?.fullName,
                    specialty: doctor.doctor?.specialty,
                    hospital_id: doctor.hospitalId,
                    role: doctor.role,
                    permissions: [
                        'read_patients',
                        'write_prescriptions',
                        'manage_schedule',
                        'view_insights'
                    ],
                    temporary_password: tempPassword,
                    requires_password_change: true
                }
            });
        }
        catch (error) {
            console.error('Add doctor error:', error);
            if (error.message === 'EMAIL_EXISTS') {
                return res.status(409).json({
                    success: false,
                    code: 'EMAIL_EXISTS',
                    message: 'Email already registered'
                });
            }
            if (error.message === 'HOSPITAL_MISMATCH') {
                return res.status(403).json({
                    success: false,
                    code: 'HOSPITAL_MISMATCH',
                    message: 'Cannot create staff for another hospital'
                });
            }
            return res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to add doctor'
            });
        }
    }
    static async getUserHospitalId(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                hospitalId: true,
                hospitalAdmin: true
            }
        });
        if (!user || !user.hospitalId) {
            throw new Error('User not found or hospital not linked');
        }
        if (user.role !== 'HOSPITAL_ADMIN') {
            throw new Error('Insufficient permissions');
        }
        return user.hospitalId;
    }
    static async generateTemporaryPassword(length = 12) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import { PasswordService } from '../../../services/password.service.js';
//# sourceMappingURL=hospitals-dashboard.controller.js.map