/**
 * Authentication and Authorization Middleware
 *
 * Handles JWT token validation and authorization checks for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js'


import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * Authenticate JWT token
 * Validates the Bearer token in the Authorization header
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        code: 'TOKEN_MISSING',
        message: 'Access token is missing'
      });
      return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        res.status(403).json({
          success: false,
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        });
        return;
      }

      req.user = user;
      next();
    });

  } catch (error: any) {
    console.error('JWT authentication error:', error);
    res.status(500).json({
      success: false,
      code: 'AUTH_ERROR',
      message: 'Authentication failed'
    });
  }
};

/**
 * Authorize Hospital Admin
 * Ensures the authenticated user is a hospital admin and owns the resource
 */
export const authorizeHospitalAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string;
    const hospitalId = req.params.hospitalId || req.body.hospital_id;

    if (!userId) {
      res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
      return;
    }

    // Get user details including role and hospital
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        hospitalId: true
      }
    });

    if (!user || user.role !== 'HOSPITAL_ADMIN') {
      res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You must be a hospital admin to access this resource'
      });
      return;
    }

    // If specific hospital ID is provided in params, validate it matches user's hospital
    if (hospitalId && user.hospitalId !== hospitalId) {
      res.status(403).json({
        success: false,
        code: 'HOSPITAL_MISMATCH',
        message: 'You can only access resources for your own hospital'
      });
      return;
    }

    next();

  } catch (error: any) {
    console.error('Hospital admin authorization error:', error);
    res.status(500).json({
      success: false,
      code: 'AUTH_ERROR',
      message: 'Authorization check failed'
    });
  }
};

/**
 * Authorize Doctor
 * Ensures the authenticated user is a doctor
 */
export const authorizeDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string;

    if (!userId) {
      res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true
      }
    });

    if (!user || user.role !== 'DOCTOR') {
      res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You must be a doctor to access this resource'
      });
      return;
    }

    next();

  } catch (error: any) {
    console.error('Doctor authorization error:', error);
    res.status(500).json({
      success: false,
      code: 'AUTH_ERROR',
      message: 'Authorization check failed'
    });
  }
};

/**
 * Authorize Pharmacist
 * Ensures the authenticated user is a pharmacist
 */
export const authorizePharmacist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string;

    if (!userId) {
      res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true
      }
    });

    if (!user || user.role !== 'PHARMACIST') {
      res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You must be a pharmacist to access this resource'
      });
      return;
    }

    next();

  } catch (error: any) {
    console.error('Pharmacist authorization error:', error);
    res.status(500).json({
      success: false,
      code: 'AUTH_ERROR',
      message: 'Authorization check failed'
    });
  }
};

/**
 * Authorize Patient
 * Ensures the authenticated user is a patient
 */
export const authorizePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string;

    if (!userId) {
      res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true
      }
    });

    if (!user || user.role !== 'PATIENT') {
      res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You must be a patient to access this resource'
      });
      return;
    }

    next();

  } catch (error: any) {
    console.error('Patient authorization error:', error);
    res.status(500).json({
      success: false,
      code: 'AUTH_ERROR',
      message: 'Authorization check failed'
    });
  }
};

/**
 * Authorize Appointment Owner
 * Ensures the authenticated user owns the appointment resource
 */
export const authorizeAppointmentOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId as string;
    // Get appointment ID from params
    const appointmentId = req.params.appointmentId;

    if (!userId) {
      res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
      return;
    }

    // Check if user is a patient
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true
      }
    });

    if (!user || user.role !== 'PATIENT') {
      res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You must be a patient to access this resource'
      });
      return;
    }

    // Get appointment details
    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        patientId: userId
      }
    });

    if (!appointment) {
      res.status(404).json({
        success: false,
        code: 'APPOINTMENT_NOT_FOUND',
        message: 'Appointment not found or you do not have permission to access it'
      });
      return;
    }

    next();

  } catch (error: any) {
    console.error('Appointment owner authorization error:', error);
    res.status(500).json({
      success: false,
      code: 'AUTH_ERROR',
      message: 'Authorization check failed'
    });
  }
};