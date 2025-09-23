import { User, UserRole } from '@prisma/client';
import { PasswordService } from './password.service.js';
import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key';

export interface StaffLoginResult {
  user: {
    user_id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
    hospital_id: string | null;
    hospital_name: string | null;
    permissions: string[];
  };
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  first_login: boolean;
  requires_password_change?: boolean;
}

export class StaffAuthService {
  static async validateStaffEmail(email: string): Promise<{ isValid: boolean; hospitalName?: string; role?: UserRole }> {
    const emailParts = email.split('@');
    if (emailParts.length !== 2) return { isValid: false };

    const [username, domain] = emailParts;
    const domainParts = domain.split('.');

    // Hospital Admin: [anything]@[hospital].curekahealth.in
    if (domain.endsWith('.curekahealth.in') && domainParts.length === 3) {
      const hospitalName = domainParts[0];
      return { isValid: true, hospitalName, role: 'HOSPITAL_ADMIN' };
    }

    // Doctors: [doctor-name]@[hospital-name].curekahealth.com
    if (domain.endsWith('.curekahealth.com') && domainParts.length === 3) {
      const hospitalName = domainParts[0];
      return { isValid: true, hospitalName, role: 'DOCTOR' };
    }

    // Pharmacists: [pharmacist-name]@[hospital-name].curekahealth.pharm
    if (domain.endsWith('.curekahealth.pharm') && domainParts.length === 3) {
      const hospitalName = domainParts[0];
      return { isValid: true, hospitalName, role: 'PHARMACIST' };
    }

    return { isValid: false };
  }

  static async findStaffUser(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        hospital: true,
        profile: true,
        doctor: true,
        pharmacist: true,
        hospitalAdmin: true
      }
    });
  }

  static async validateStaffCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.findStaffUser(email);

    if (!user || !user.passwordHash) {
      return null;
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new Error('ACCOUNT_LOCKED');
    }

    const isValid = await PasswordService.verifyPassword(password, user.passwordHash);

    if (isValid) {
      // Reset login attempts on successful login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockoutUntil: null,
          lastLogin: new Date(),
          updatedAt: new Date()
        }
      });
      return user;
    } else {
      // Increment login attempts
      const newAttempts = (user.loginAttempts || 0) + 1;
      const updates: any = { loginAttempts: newAttempts, updatedAt: new Date() };

      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        const lockoutTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        updates.lockoutUntil = lockoutTime;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updates
      });

      return null;
    }
  }

  static generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const permissions = this.getUserPermissions(user.role);

    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        hospitalId: user.hospitalId,
        permissions
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        tokenType: 'refresh'
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '12h' }
    );

    return { accessToken, refreshToken };
  }

  static getUserPermissions(role: UserRole): string[] {
    switch (role) {
      case 'HOSPITAL_ADMIN':
        return [
          'manage_staff',
          'view_hospital_data',
          'manage_settings',
          'view_reports'
        ];
      case 'DOCTOR':
        return [
          'read_patients',
          'write_prescriptions',
          'view_appointments',
          'update_medical_records'
        ];
      case 'PHARMACIST':
        return [
          'read_prescriptions',
          'dispense_medications',
          'inventory_management',
          'view_patient_info'
        ];
      default:
        return [];
    }
  }

  static async prepareLoginResponse(user: User): Promise<StaffLoginResult> {
    const { accessToken, refreshToken } = this.generateTokens(user);

    const firstNameLogin = !user.lastLogin;
    const requiresPasswordChange = user.forcePasswordChange || user.passwordTemp;

    // Get full name - we'll use the ID temporarily or null
    const fullName = null; // No profile in user table, would need to join with Profile table

    return {
      user: {
        user_id: user.id,
        email: user.email || '',
        full_name: fullName,
        role: user.role,
        hospital_id: user.hospitalId || null,
        hospital_name: user.hospital?.name || null,
        permissions: this.getUserPermissions(user.role)
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 7200, // 2 hours in seconds
      first_login: firstNameLogin,
      ...(requiresPasswordChange && { requires_password_change: true })
    };
  }
}