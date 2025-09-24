import { validationResult } from 'express-validator';
import { HospitalsService } from './hospitals.service.js';
export class HospitalsController {
    static async createHospital(req, res) {
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
            const { hospital_name, admin_email, admin_full_name } = req.body;
            const result = await HospitalsService.createHospitalAndAdmin({
                hospital_name,
                admin_email,
                admin_full_name
            });
            return res.status(201).json({
                success: true,
                data: result,
                message: 'Hospital and admin account created successfully. Temporary credentials generated.'
            });
        }
        catch (error) {
            console.error('Create hospital error:', error);
            if (error.message === 'HOSPITAL_NAME_EXISTS') {
                return res.status(409).json({
                    success: false,
                    code: 'HOSPITAL_NAME_EXISTS',
                    message: 'Hospital name already exists'
                });
            }
            if (error.message === 'ADMIN_EMAIL_EXISTS') {
                return res.status(409).json({
                    success: false,
                    code: 'ADMIN_EMAIL_EXISTS',
                    message: 'Admin email already registered'
                });
            }
            if (error.message === 'HOSPITAL_NAME_MISMATCH') {
                return res.status(400).json({
                    success: false,
                    code: 'HOSPITAL_NAME_MISMATCH',
                    message: 'Hospital name must match email domain'
                });
            }
            return res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to create hospital and admin account'
            });
        }
    }
    static async getHospital(req, res) {
        try {
            const { id } = req.params;
            const hospital = await HospitalsService.getHospitalById(id);
            return res.status(200).json({
                success: true,
                data: hospital
            });
        }
        catch (error) {
            console.error('Get hospital error:', error);
            if (error.message === 'HOSPITAL_NOT_FOUND') {
                return res.status(404).json({
                    success: false,
                    code: 'HOSPITAL_NOT_FOUND',
                    message: 'Hospital not found'
                });
            }
            return res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to retrieve hospital'
            });
        }
    }
}
//# sourceMappingURL=hospitals.controller.js.map