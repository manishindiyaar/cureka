import { prisma } from '@/lib/prisma.js';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
function validatePhoneNumber(phone) {
    const phoneRegex = /^\+91\d{10}$/;
    return phoneRegex.test(phone);
}
function validateOTP(otp) {
    return /^\d{4}$/.test(otp);
}
async function findLatestOtp(phoneNumber) {
    return await prisma.otp.findFirst({
        where: { number: phoneNumber },
        orderBy: { createdAt: 'desc' }
    });
}
function isOtpExpired(createdAt) {
    const expiryTime = new Date(createdAt.getTime() + (OTP_EXPIRY_MINUTES * 60 * 1000));
    return new Date() > expiryTime;
}
function generateTokens(user) {
    const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ userId: user.id, tokenType: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}
export async function verifyPatientOtp(req, res) {
    try {
        const { phone_number, otp_code } = req.body;
        if (!phone_number || !otp_code) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Phone number and OTP code are required'
            });
        }
        if (!validatePhoneNumber(phone_number)) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Phone number must be in E.164 format with +91 prefix'
            });
        }
        if (!validateOTP(otp_code)) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'OTP must be 4 digits'
            });
        }
        const phone = phone_number.substring(1);
        const otp = await findLatestOtp(phone);
        if (!otp) {
            return res.status(400).json({
                success: false,
                code: 'INVALID_OTP',
                message: 'Invalid or expired OTP'
            });
        }
        if (isOtpExpired(otp.createdAt)) {
            await prisma.otp.delete({ where: { id: otp.id } });
            return res.status(400).json({
                success: false,
                code: 'EXPIRED_OTP',
                message: 'OTP has expired'
            });
        }
        if (otp.otp !== parseInt(otp_code)) {
            return res.status(400).json({
                success: false,
                code: 'INVALID_OTP',
                message: 'Invalid OTP'
            });
        }
        await prisma.otp.delete({ where: { id: otp.id } });
        let user = await prisma.user.findUnique({
            where: { phone }
        });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: randomUUID(),
                    phone,
                    role: 'PATIENT'
                }
            });
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { updatedAt: new Date() }
        });
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id }
        });
        const { accessToken, refreshToken } = generateTokens(user);
        return res.status(200).json({
            success: true,
            data: {
                user: {
                    user_id: user.id,
                    phone_number: phone_number,
                    full_name: profile?.fullName || null
                },
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'Bearer',
                expires_in: 86400
            }
        });
    }
    catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).json({
            success: false,
            code: 'INTERNAL_ERROR',
            message: 'Failed to verify OTP'
        });
    }
}
//# sourceMappingURL=patient.otp.verify.js.map