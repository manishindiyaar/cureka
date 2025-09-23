import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
  OtpVerificationService,
  TokenService,
  validatePhoneNumber,
  validateOTP
} from '../../../../services/otp-verify.service.js';
import { PatientService } from './patient.service.js';

export class OtpVerifyController {
  static async verifyOtp(req: Request, res: Response) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Invalid phone number or OTP format',
          errors: errors.array()
        });
      }

      const { phone_number, otp_code } = req.body;

      // Validate inputs
      if (!validatePhoneNumber(phone_number) || !validateOTP(otp_code)) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Invalid phone number or OTP format'
        });
      }

      // Verify OTP
      await OtpVerificationService.verifyOtp(phone_number, otp_code);

      // Check if user exists
      let user = await PatientService.findUserByPhone(phone_number);

      if (!user) {
        // Create new user
        user = await PatientService.createUser(phone_number);
      } else {
        // Update last login timestamp
        await PatientService.updateUserLastLogin(user.id);
      }

      // For type safety - user should be defined at this point
      if (!user) {
        throw new Error('Failed to create or retrieve user');
      }

      // Generate tokens
      const { accessToken, refreshToken } = TokenService.generateTokens(user);

      // Return success response
      return res.status(200).json({
        success: true,
        data: {
          user: {
            user_id: user.id,
            phone_number: user.phone,
            full_name: null // Will be updated when user completes profile
          },
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: 86400
        }
      });

    } catch (error: any) {
      // Handle specific errors
      if (error.message === 'Invalid or expired OTP' || error.message === 'OTP has expired' || error.message === 'Invalid OTP') {
        return res.status(400).json({
          success: false,
          code: 'INVALID_OTP',
          message: error.message
        });
      }

      // Generic error
      console.error('Error in verifyOtp:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify OTP'
      });
    }
  }
}