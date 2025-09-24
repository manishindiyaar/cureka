import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
export const authenticateJWT = (req, res, next) => {
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
        jwt.verify(token, JWT_SECRET, (err, user) => {
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
    }
    catch (error) {
        console.error('JWT authentication error:', error);
        res.status(500).json({
            success: false,
            code: 'AUTH_ERROR',
            message: 'Authentication failed'
        });
    }
};
export const authorizeHospitalAdmin = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const hospitalId = req.params.hospitalId || req.body.hospital_id;
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
        if (hospitalId && user.hospitalId !== hospitalId) {
            res.status(403).json({
                success: false,
                code: 'HOSPITAL_MISMATCH',
                message: 'You can only access resources for your own hospital'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Hospital admin authorization error:', error);
        res.status(500).json({
            success: false,
            code: 'AUTH_ERROR',
            message: 'Authorization check failed'
        });
    }
};
export const authorizeDoctor = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
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
    }
    catch (error) {
        console.error('Doctor authorization error:', error);
        res.status(500).json({
            success: false,
            code: 'AUTH_ERROR',
            message: 'Authorization check failed'
        });
    }
};
export const authorizePharmacist = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
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
    }
    catch (error) {
        console.error('Pharmacist authorization error:', error);
        res.status(500).json({
            success: false,
            code: 'AUTH_ERROR',
            message: 'Authorization check failed'
        });
    }
};
export const authorizePatient = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
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
    }
    catch (error) {
        console.error('Patient authorization error:', error);
        res.status(500).json({
            success: false,
            code: 'AUTH_ERROR',
            message: 'Authorization check failed'
        });
    }
};
export const authorizeAppointmentOwner = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const appointmentId = req.params.appointmentId;
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
    }
    catch (error) {
        console.error('Appointment owner authorization error:', error);
        res.status(500).json({
            success: false,
            code: 'AUTH_ERROR',
            message: 'Authorization check failed'
        });
    }
};
//# sourceMappingURL=auth.middleware.js.map