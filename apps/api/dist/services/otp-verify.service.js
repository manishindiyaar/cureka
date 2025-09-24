import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key';
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
const MAX_OTP_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS || '5');
export const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+91\d{10}$/;
    return phoneRegex.test(phone);
};
export const validateOTP = (otp) => {
    return /^\d{4}$/.test(otp);
};
export class OtpVerificationService {
    static async verifyOtp(phoneNumber, otpCode) {
        try {
            const latestOtp = await prisma.otp.findFirst({
                where: {
                    number: phoneNumber.substring(1)
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            if (!latestOtp) {
                throw new Error('Invalid or expired OTP');
            }
            const createdTime = new Date(latestOtp.createdAt);
            const expiryTime = new Date(createdTime.getTime() + (OTP_EXPIRY_MINUTES * 60000));
            if (new Date() > expiryTime) {
                await prisma.otp.delete({
                    where: {
                        id: latestOtp.id
                    }
                });
                throw new Error('OTP has expired');
            }
            if (parseInt(otpCode) !== latestOtp.otp) {
                throw new Error('Invalid OTP');
            }
            await prisma.otp.delete({
                where: {
                    id: latestOtp.id
                }
            });
            return true;
        }
        catch (error) {
            throw error;
        }
    }
}
export class TokenService {
    static generateTokens(user) {
        const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        const refreshToken = jwt.sign({ userId: user.id, tokenType: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
        return { accessToken, refreshToken };
    }
}
export class PatientAuthService {
    static async createUserIfNotExists(phoneNumber) {
        try {
            let user = await prisma.user.findUnique({
                where: {
                    phone: phoneNumber
                }
            });
            if (user) {
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
        }
        catch (error) {
            throw new Error('Failed to create user');
        }
    }
}
//# sourceMappingURL=otp-verify.service.js.map