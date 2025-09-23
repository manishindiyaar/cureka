import { prisma } from '../../../lib/prisma.js';
import { PasswordService } from '../../../services/password.service.js';
import { CreateHospitalDto } from './hospitals.dto.js';

export class HospitalsService {
  static async generateTemporaryPassword(length: number = 16): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  static async createHospitalAndAdmin(hospitalData: CreateHospitalDto): Promise<any> {
    // Extract hospital name from email (admin@hospital.curekahealth.in -> hospital)
    const emailParts = hospitalData.admin_email.split('@');
    const domainParts = emailParts[1].split('.');
    const hospitalNameFromEmail = domainParts[0];

    // Validate hospital name matches email domain
    if (hospitalData.hospital_name.toLowerCase().replace(/\s+/g, '-') !== hospitalNameFromEmail) {
      throw new Error('HOSPITAL_NAME_MISMATCH');
    }

    // Check if hospital name already exists
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

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: hospitalData.admin_email }
    });

    if (existingUser) {
      throw new Error('ADMIN_EMAIL_EXISTS');
    }

    // Generate temporary password
    const tempPassword = await this.generateTemporaryPassword(16);
    const passwordHash = await PasswordService.hashPassword(tempPassword);

    // Create hospital and admin in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create hospital
      const hospital = await prisma.hospital.create({
        data: {
          name: hospitalData.hospital_name
        }
      });

      // Create admin user
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

    // In a real implementation, we would send the temporary password to the admin's email
    // For now, we'll just return it in the response (but in production, it should be sent via secure email)

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
      temporary_password: tempPassword // In production, remove this and send via secure email
    };
  }

  static async getHospitalById(hospitalId: string): Promise<any> {
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