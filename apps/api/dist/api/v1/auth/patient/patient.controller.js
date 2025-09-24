import { validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { prisma } from '../../../../lib/prisma.js';
import { sendOtpSms } from '../../../../services/twilio.service.js';
const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000);
};
export const otpRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        code: 'rate_limit_exceeded',
        message: 'Too many OTP requests. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.body.phone_number || req.ip;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            code: 'rate_limit_exceeded',
            message: 'Too many OTP requests. Please try again after 15 minutes.'
        });
    }
});
export const requestOtp = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                code: 'invalid_phone_format',
                message: 'Phone number must be in E.164 format starting with +91',
                errors: errors.array()
            });
        }
        const { phone_number } = req.body;
        if (!String(phone_number).startsWith('+91')) {
            return res.status(400).json({
                success: false,
                code: 'invalid_phone_format',
                message: 'Phone number must be in E.164 format starting with +91'
            });
        }
        const otp = generateOtp();
        await prisma.otp.deleteMany({
            where: {
                number: phone_number.substring(1)
            }
        });
        await prisma.otp.create({
            data: {
                number: String(phone_number).substring(1),
                otp: otp
            }
        });
        const cleanPhoneNumber = String(phone_number).replace(/[+\s]/g, '');
        console.log(`Sending OTP ${otp} to +${cleanPhoneNumber}`);
        try {
            await sendOtpSms(phone_number, otp.toString());
            console.log(`OTP SMS sent successfully to ${phone_number}`);
        }
        catch (smsError) {
            console.error('Twilio SMS failed:', smsError);
            return res.status(200).json({
                success: true,
                message: 'OTP generated but SMS failed. Check server logs',
                warning: 'SMS service temporarily unavailable'
            });
        }
        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully'
        });
    }
    catch (error) {
        console.error('Error in requestOtp:', error);
        return res.status(500).json({
            success: false,
            code: 'internal_error',
            message: 'Something went wrong while sending OTP'
        });
    }
};
export const verifyOtp = async (req, res) => {
    try {
        const { phone_number, otp } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                code: 'invalid_otp_format',
                message: 'Invalid request format',
                errors: errors.array()
            });
        }
        const latestOtp = await prisma.otp.findFirst({
            where: {
                number: String(phone_number).substring(1)
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        if (!latestOtp) {
            return res.status(400).json({
                success: false,
                code: 'otp_not_found',
                message: 'Invalid or expired OTP'
            });
        }
        const now = new Date();
        const createdAt = new Date(latestOtp.createdAt);
        const expiryTime = new Date(createdAt.getTime() + 5 * 60 * 1000);
        if (now > expiryTime) {
            await prisma.otp.delete({
                where: {
                    id: latestOtp.id
                }
            });
            return res.status(400).json({
                success: false,
                code: 'otp_expired',
                message: 'OTP has expired'
            });
        }
        if (parseInt(otp) !== latestOtp.otp) {
            return res.status(400).json({
                success: false,
                code: 'invalid_otp',
                message: 'Invalid OTP'
            });
        }
        console.log(`OTP verified for ${phone_number}`);
        await prisma.otp.delete({
            where: {
                id: latestOtp.id
            }
        });
        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            token: null
        });
    }
    catch (error) {
        console.error('Error in verifyOtp:', error);
        return res.status(500).json({
            success: false,
            code: 'internal_error',
            message: 'Something went wrong while verifying OTP'
        });
    }
};
//# sourceMappingURL=patient.controller.js.map