import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { prisma } from '../../../../lib/prisma.js';
import { sendOtpSms } from '../../../../services/twilio.service.js';

// OTP Service
const generateOtp = (): number => {
  return Math.floor(1000 + Math.random() * 9000);
};

// Rate limiting configuration
export const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    code: 'rate_limit_exceeded',
    message: 'Too many OTP requests. Please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use phone number as key for rate limiting
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

// Controller for requesting OTP
export const requestOtp = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
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

    // Validate Indian phone number (must start with +91)
    if (!String(phone_number).startsWith('+91')) {
      return res.status(400).json({
        success: false,
        code: 'invalid_phone_format',
        message: 'Phone number must be in E.164 format starting with +91'
      });
    }

    // Generate 4-digit OTP
    const otp = generateOtp();

    // Remove any existing OTPs for this phone number
    await prisma.otp.deleteMany({
      where: {
        number: phone_number.substring(1) // Remove the + for storage
      }
    });

    // Store OTP in database
    await prisma.otp.create({
      data: {
        number: String(phone_number).substring(1),
        otp: otp
      }
    });

    // Remove + from phone number for SMS
    const cleanPhoneNumber = String(phone_number).replace(/[+\s]/g, '');

    // TODO: Send OTP via Twilio SMS
    console.log(`Sending OTP ${otp} to +${cleanPhoneNumber}`);
    // Send via Twilio service
    try {
      await sendOtpSms(phone_number, otp.toString());
      console.log(`OTP SMS sent successfully to ${phone_number}`);
    } catch (smsError) {
      console.error('Twilio SMS failed:', smsError);
      // Fallback: send response but log failure
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

  } catch (error) {
    console.error('Error in requestOtp:', error);
    return res.status(500).json({
      success: false,
      code: 'internal_error',
      message: 'Something went wrong while sending OTP'
    });
  }
};

// Controller for verifying OTP
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone_number, otp } = req.body;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: 'invalid_otp_format',
        message: 'Invalid request format',
        errors: errors.array()
      });
    }

    // Find latest OTP for this phone number
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

    // Verify OTP
    const now = new Date();
    const createdAt = new Date(latestOtp.createdAt);
    const expiryTime = new Date(createdAt.getTime() + 5 * 60 * 1000); // 5 minutes expiry

    if (now > expiryTime) {
      // Delete expired OTP
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

    // TODO: Create or update user after OTP verification
    console.log(`OTP verified for ${phone_number}`);

    // Delete used OTP
    await prisma.otp.delete({
      where: {
        id: latestOtp.id
      }
    });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      // TODO: Add JWT token after user creation
      token: null
    });

  } catch (error) {
    console.error('Error in verifyOtp:', error);
    return res.status(500).json({
      success: false,
      code: 'internal_error',
      message: 'Something went wrong while verifying OTP'
    });
  }
};