import { validationResult } from 'express-validator';
import { vapiService } from '../../../../services/vapi.service.js';
export const handleVapiSession = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                code: 'UNAUTHORIZED',
                message: 'User not authenticated'
            });
        }
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: errors.array()
            });
        }
        const patientId = req.user.userId;
        const assistantId = req.body.assistant_id || process.env.VAPI_ASSISTANT_ID;
        if (!assistantId) {
            return res.status(400).json({
                success: false,
                code: 'CONFIG_ERROR',
                message: 'Assistant ID not configured'
            });
        }
        const vapiConfig = await vapiService.getVapiConfiguration(assistantId, patientId);
        res.status(200).json({
            success: true,
            message: 'Vapi configuration retrieved successfully',
            data: {
                vapi_config: vapiConfig.config,
                session_id: vapiConfig.sessionId
            }
        });
    }
    catch (error) {
        console.error('[/vapi/start] Error:', error);
        res.status(500).json({
            success: false,
            code: 'INTERNAL_ERROR',
            message: 'Failed to get Vapi configuration',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
//# sourceMappingURL=vapi.controller.js.map