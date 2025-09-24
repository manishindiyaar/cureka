import { validationResult } from 'express-validator';
import { DoctorsService } from './doctors.service.js';
export class DoctorsController {
    static async createDoctor(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    errors: errors.array()
                });
            }
            const hospitalAdminId = req.headers['x-hospital-admin-id'] || 'test-admin-id';
            const { email, full_name, specialty, hospital_id } = req.body;
            const doctor = await DoctorsService.createDoctor(hospitalAdminId, {
                email,
                full_name,
                specialty,
                hospital_id
            });
            return res.status(201).json({
                success: true,
                data: doctor,
                message: 'Doctor profile created successfully. Temporary credentials generated.'
            });
        }
        catch (error) {
            console.error('Create doctor error:', error);
            if (error.message === 'EMAIL_EXISTS') {
                return res.status(409).json({
                    success: false,
                    code: 'EMAIL_EXISTS',
                    message: 'Email already registered'
                });
            }
            if (error.message === 'HOSPITAL_NOT_FOUND') {
                return res.status(404).json({
                    success: false,
                    code: 'HOSPITAL_NOT_FOUND',
                    message: 'Hospital not found'
                });
            }
            if (error.message === 'INSUFFICIENT_PERMISSIONS') {
                return res.status(403).json({
                    success: false,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Only hospital admins can create doctors'
                });
            }
            if (error.message === 'HOSPITAL_MISMATCH') {
                return res.status(403).json({
                    success: false,
                    code: 'HOSPITAL_MISMATCH',
                    message: 'Hospital admin can only create staff for their own hospital'
                });
            }
            if (error.message === 'EMAIL_DOMAIN_MISMATCH') {
                return res.status(400).json({
                    success: false,
                    code: 'EMAIL_DOMAIN_MISMATCH',
                    message: 'Email domain must match hospital name'
                });
            }
            return res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to create doctor profile'
            });
        }
    }
    static async getDoctor(req, res) {
        try {
            const { id } = req.params;
            const doctor = await DoctorsService.getDoctorById(id);
            return res.status(200).json({
                success: true,
                data: doctor
            });
        }
        catch (error) {
            console.error('Get doctor error:', error);
            if (error.message === 'DOCTOR_NOT_FOUND') {
                return res.status(404).json({
                    success: false,
                    code: 'DOCTOR_NOT_FOUND',
                    message: 'Doctor not found'
                });
            }
            return res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve doctor profile'
            });
        }
    }
}
//# sourceMappingURL=doctors.controller.js.map