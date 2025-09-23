import { User, UserRole } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';
import { PasswordService } from '../../../services/password.service.js';
import { CreateDoctorDto } from './doctors.dto.js';

export class DoctorsService {
  static async generateTemporaryPassword(length: number = 12): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  static async createDoctor(hospitalAdminId: string, doctorData: Omit<CreateDoctorDto, 'password'>): Promise<any> {
    // Verify that the requesting user is a hospital admin
    const adminUser = await prisma.user.findUnique({
      where: { id: hospitalAdminId },
      include: { hospitalAdmin: true }
    });

    if (!adminUser || adminUser.role !== 'HOSPITAL_ADMIN' || !adminUser.hospitalAdmin) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: doctorData.email }
    });

    if (existingUser) {
      throw new Error('EMAIL_EXISTS');
    }

    // Check if hospital exists and matches admin's hospital
    const hospital = await prisma.hospital.findUnique({
      where: { id: doctorData.hospital_id }
    });

    if (!hospital) {
      throw new Error('HOSPITAL_NOT_FOUND');
    }

    // Verify hospital matches admin's hospital
    if (hospital.id !== adminUser.hospitalAdmin.hospitalId) {
      throw new Error('HOSPITAL_MISMATCH');
    }

    // Extract hospital name from email and verify it matches
    const emailParts = doctorData.email.split('@');
    const domainParts = emailParts[1].split('.');
    const hospitalNameFromEmail = domainParts[0];

    if (hospital.name.toLowerCase().replace(/\s+/g, '-') !== hospitalNameFromEmail) {
      throw new Error('EMAIL_DOMAIN_MISMATCH');
    }

    // Generate temporary password
    const tempPassword = await this.generateTemporaryPassword(12);
    const passwordHash = await PasswordService.hashPassword(tempPassword);

    // Create user and doctor profile in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create user
      const user = await prisma.user.create({
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

    // Return formatted response
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

  static async getDoctorById(doctorId: string): Promise<any> {
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