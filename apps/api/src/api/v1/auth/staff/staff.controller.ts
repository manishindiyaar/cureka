import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { StaffAuthService } from '../../../../services/staff-auth.service.js';

export class StaffController {
  static async login(req: Request, res: Response) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Validate email domain
      const emailValidation = await StaffAuthService.validateStaffEmail(email);
      if (!emailValidation.isValid) {
        return res.status(401).json({
          success: false,
          code: 'DOMAIN_NOT_ALLOWED',
          message: 'Email domain not allowed for staff login'
        });
      }

      // Validate credentials - include hospital relationship
      let user;
      try {
        user = await StaffAuthService.validateStaffCredentials(email, password);
        // User is validated - now get with hospital info
        if (user) {
          user = await StaffAuthService.findStaffUser(email);
        }
      } catch (error: any) {
        if (error.message === 'ACCOUNT_LOCKED') {
          return res.status(423).json({
            success: false,
            code: 'ACCOUNT_LOCKED',
            message: 'Account temporarily locked due to multiple failed attempts'
          });
        }
        throw error;
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        });
      }

      // Check if user has the right role
      if (user.role !== emailValidation.role) {
        return res.status(403).json({
          success: false,
          code: 'INVALID_ROLE',
          message: 'User role does not match email domain'
        });
      }

      // Prepare and send response
      const loginResponse = await StaffAuthService.prepareLoginResponse(user);

      return res.status(200).json({
        success: true,
        data: loginResponse
      });

    } catch (error: any) {
      console.error('Staff login error:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during login'
      });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded: any = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key');

      // Get user
      const user = await StaffAuthService.findStaffUser(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'User not found'
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken } = StaffAuthService.generateTokens(user);

      return res.status(200).json({
        success: true,
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: 7200
        }
      });

    } catch (error: any) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid or expired refresh token'
        });
      }

      console.error('Refresh token error:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during token refresh'
      });
    }
  }
}