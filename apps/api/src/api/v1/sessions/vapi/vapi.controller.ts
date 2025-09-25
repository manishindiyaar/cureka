import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { vapiService } from '../../../../services/vapi.service.js';

/**
 * Handle Vapi session configuration request
 * Validates authentication and returns safe configuration for mobile app
 */
export const handleVapiSession = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated via JWT
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
    }

    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array()
      });
    }

    // Get patient ID from token
    const patientId = req.user.userId;

    // Validate patient context
    const assistantId = req.body.assistant_id || process.env.VAPI_ASSISTANT_ID;

    if (!assistantId) {
      return res.status(400).json({
        success: false,
        code: 'CONFIG_ERROR',
        message: 'Assistant ID not configured'
      });
    }

    // Get Vapi configuration
    const vapiConfig = await vapiService.getVapiConfiguration(assistantId, patientId);

    // Send response following existing pattern
    res.status(200).json({
      success: true,
      message: 'Vapi configuration retrieved successfully',
      data: {
        vapi_config: vapiConfig.config,
        session_id: vapiConfig.sessionId
      }
    });

  } catch (error) {
    // Follow existing error pattern from /make-call endpoint
    console.error('[/vapi/start] Error:', error);
    res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Failed to get Vapi configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};