import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key';
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
const MAX_OTP_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS || '5');

// Validation functions
export const validatePhoneNumber = (phone: string): boolean => {
  // E.164 format regex for Indian numbers
  const phoneRegex = /^\+91\d{10}$/;
  return phoneRegex.test(phone);
};

export const validateOTP = (otp: string): boolean => {
  // Must be exactly 4 digits
  return /^\d{4}$/.test(otp);
};

// OTP Verification Service
export class OtpVerificationService {
  static async verifyOtp(phoneNumber: string, otpCode: string): Promise<boolean> {
    try {
      // Get OTP from database
      const latestOtp = await prisma.otp.findFirst({
        where: {
          number: phoneNumber.substring(1) // Remove the + for storage
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!latestOtp) {
        throw new Error('Invalid or expired OTP');
      }

      // Check if OTP is expired
      const createdTime = new Date(latestOtp.createdAt);
      const expiryTime = new Date(createdTime.getTime() + (OTP_EXPIRY_MINUTES * 60000));

      if (new Date() > expiryTime) {
        // Delete expired OTP
        await prisma.otp.delete({
          where: {
            id: latestOtp.id
          }
        });
        throw new Error('OTP has expired');
      }

      // Check if OTP matches
      if (parseInt(otpCode) !== latestOtp.otp) {
        throw new Error('Invalid OTP');
      }

      // Delete OTP after successful verification (single-use)
      await prisma.otp.delete({
        where: {
          id: latestOtp.id
        }
      });

      return true;
    } catch (error) {
      throw error;
    }
  }
}

// Token Service
export class TokenService {
  static generateTokens(user: any) {
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, tokenType: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }
}

// Patient Auth Service
export class PatientAuthService {
  static async createUserIfNotExists(phoneNumber: string): Promise<any> {
    try {
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: {
          phone: phoneNumber
        }
      });

      if (user) {
        // Update last login timestamp
        user = await prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            updatedAt: new Date()
          }
        });
        return user;
      }

      // Create new user
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          phone: phoneNumber,
          role: 'PATIENT',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return user;
    } catch (error) {
      throw new Error('Failed to create user');
    }
  }
}