import { Router } from 'express';
import { handleVapiSession } from './vapi.controller.js';
import { startVapiSessionValidation } from './vapi.validation.js';
import { authenticateJWT } from '../../../../middleware/auth.middleware.js';

const router = Router();

/**
 * POST /api/v1/sessions/vapi/start
 * Start a Vapi session for voice assistant
 * Requires JWT authentication - applied at the router level
 */
router.post('/',
  authenticateJWT,
  startVapiSessionValidation(),
  handleVapiSession
);

export default router;