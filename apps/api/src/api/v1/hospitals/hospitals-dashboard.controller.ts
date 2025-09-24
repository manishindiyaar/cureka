/**
 * Hospital Dashboard Management
 *
 * Handles hospital dashboard operations including staff management,
 * hospital viewing, and admin features
 */

import { Request, Response } from 'express';
import { prisma } from '../../../lib/prisma.js';

export class HospitalsDashboardController {
  /**
   * Get hospital dashboard overview
   * Includes basic stats and hospital info
   */
  static async getDashboardOverview(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId as string; // Should be set by auth middleware

      // Get hospital details
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

      // Get count of each staff type
      const staffCounts = {
        ADMIN: hospital.users.filter((u: any) => u.role === 'HOSPITAL_ADMIN').length,
        DOCTOR: hospital.users.filter((u: any) => u.role === 'DOCTOR').length,
        PHARMACIST: hospital.users.filter((u: any) => u.role === 'PHARMACIST').length,
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

    } catch (error: any) {
      console.error('Dashboard overview error:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Failed to get dashboard overview'
      });
    }
  }

  /**
   * Manage hospital staff (doctors/pharmacists)
   * List, add, update, remove
   */
  static async getStaffList(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId as string;
      const { role } = req.query as { role?: string };

      const hospitalId = await HospitalsDashboardController.getUserHospitalId(userId);

      // Get users by role and hospital
      const whereClause: any = {
        hospitalId: hospitalId,
        role: { in: ['DOCTOR', 'PHARMACIST'] } // Not HOSPITAL_ADMIN
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
          staff: staff.map((user: any) => ({
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

    } catch (error: any) {
      console.error('Get staff list error:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Failed to get staff list'
      });
    }
  }

  /**
   * Add new doctor to hospital
   * Creates doctor with temporary password
   */
  static async addDoctor(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId as string;
      const {
        first_name,
        last_name,
        specialization,
        license_number,
        email,
        phone,
        gender,
        date_of_birth,
        hospital_id,
        full_name // Optional full name
      } = req.body;

      // Validate it's a hospital admin making this request
      const adminHospitalId = await HospitalsDashboardController.getUserHospitalId(userId);

      // Validate inputs (similar to doctors service)
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      // Generate temporary password (similar to existing implementation)
      const tempPassword = await HospitalsDashboardController.generateTemporaryPassword(12);
      const passwordHash = await PasswordService.hashPassword(tempPassword);

      // Create doctor user
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
          temporary_password: tempPassword, // Only sent once
          requires_password_change: true
        }
      });

    } catch (error: any) {
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

  /**
   * Helper function to get user's hospital ID
   * Extract hospital ID from authenticated user
   */
  private static async getUserHospitalId(userId: string): Promise<string> {
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

    // Only hospital admin should be accessing these features
    if (user.role !== 'HOSPITAL_ADMIN') {
      throw new Error('Insufficient permissions');
    }

    return user.hospitalId;
  }

  /**
   * Generate temporary secure password
   */
  private static async generateTemporaryPassword(length: number = 12): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

// Import the necessary modules
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { PasswordService } from '../../../services/password.service.js';