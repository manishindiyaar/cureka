import { body } from 'express-validator';
export const startVapiSessionValidation = () => {
    return [
        body('assistant_id')
            .optional()
            .isString()
            .isLength({ min: 1, max: 100 })
            .withMessage('Assistant ID must be a valid string'),
        body('session_type')
            .optional()
            .isIn(['appointment_booking', 'general_inquiry', 'prescription_refill'])
            .withMessage('Session type must be one of: appointment_booking, general_inquiry, prescription_refill'),
        body('patient_context')
            .optional()
            .isObject()
            .withMessage('Patient context must be an object'),
        body('patient_context.patient_id')
            .optional()
            .isString()
            .isLength({ min: 1 })
            .withMessage('Patient ID must be a valid string'),
    ];
};
//# sourceMappingURL=vapi.validation.js.map