import { Router } from 'express';
import { handleVapiSession } from './vapi.controller.js';
import { startVapiSessionValidation } from './vapi.validation.js';
import { authenticateJWT } from '../../../../middleware/auth.middleware.js';
const router = Router();
router.post('/', authenticateJWT, startVapiSessionValidation(), handleVapiSession);
export default router;
//# sourceMappingURL=vapi.routes.js.map