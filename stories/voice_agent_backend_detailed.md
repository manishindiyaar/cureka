# Story: Vapi Sessions Backend Endpoint

## Story
As a backend developer,
I want to create a secure endpoint that provides authenticated access to Vapi assistant,
so that mobile app can initialize voice sessions without exposing our API keys.

## Observations from Existing Code and Vapi Documentation
Refer @/Users/manish/Desktop/cureka/sara_tests/AUTH_TESTING_GUIDE.md for authentication details.
### Current Architecture Pattern
From the existing `/make-call` endpoint, we observe:
- Uses `@vapi-ai/server-sdk` with telephony focus: `vapiClient.calls.create()`
- JWT authentication not currently implemented in the shown code
- Direct SDK calls without session management
- Hard-coded credentials (needs to be moved to env vars)

### Vapi App/Session Architecture
Based on Vapi documentation analysis:
- Web/app sessions primarily use `@vapi-ai/web` SDK on mobile client
- Server-side doesn't directly create "sessions" - it provides authenticated configuration
- The mobile app needs: public API key, assistant ID, and any auth validation from backend

### Corrected Implementation Approach
The backend should NOT create sessions but rather:
1. Validate the patient authentication
2. Provide safe configuration data to the mobile app
3. Never expose the secret API key
4. Follow existing error patterns from `/make-call` endpoint

## Acceptance Criteria (Updated)
1. Create `POST /api/v1/sessions/vapi/start` endpoint following existing Express patterns
2. Implement JWT authentication validation (new requirement)
3. Validate patient context and permissions
4. Return public Vapi configuration data using existing response format
5. Handle all errors following exact pattern from `/make-call` endpoint
6. Move all credentials to environment variables
7. Add proper JSDoc documentation
8. Include request validation for required patient context

## Technical Implementation Notes (Corrected)

### Updated Endpoint Flow
```javascript
// apps/api/routes/vapiSessions.js
import express from "express";
import { authenticateToken } from "../middleware/auth.js"; // Assuming JWT middleware exists

const router = express.Router();

router.post('/vapi/start',
  authenticateToken, // Add JWT auth validation
  async (req, res) => {
    try {
      // Validate user is a patient (not just any authenticated user)
      if (req.user.type !== 'patient') {
        return res.status(403).json({
          error: "Forbidden",
          details: "Only patients can access voice assistant"
        });
      }

      // Build response following existing pattern from /make-call
      return res.json({
        success: true,
        data: {
          // These are PUBLIC credentials meant for mobile app
          apiKey: process.env.VAPI_PUBLIC_API_KEY, // Separate public key for clients
          assistantId: process.env.VAPI_ASSISTANT_ID,
          patientContext: {
            id: req.user.id,
            validatedAt: new Date().toISOString()
          }
        },
        // Following exact success pattern from /make-call
        message: "Vapi configuration retrieved"
      });

    } catch (err) {
      // Follow exact error pattern from /make-call endpoint
      console.error("[/vapi/start] Internal error:", err);
      return res.status(500).json({
        error: "Internal server error",
        details: String(err)
      });
    }
  }
);
```

### Error Handling Standard
Follow existing error response pattern:
```javascript
{
  "success": false,
  "error": {
    "code": "VAPI_SESSION_FAILED",
    "message": "Unable to create voice session",
    "details": "Vapi service temporarily unavailable"
  }
}
```

### Environment Variables
Add to `.env.example`:
```
# Vapi Configuration
VAPI_API_KEY=your_vapi_api_key_here
VAPI_ASSISTANT_ID=your_assistant_id_here
```

## Test Requirements
Create tests in `sara_tests/vapiSessions.test.js`:
- Test successful session creation with valid JWT
- Test authentication failure without token
- Test Vapi service error handling
- Test concurrent session requests
- Test malformed patient context handling

## Integration Verification Criteria
1. **Existing Functionality**: Confirm `/auth/*` endpoints continue to work normally
2. **Performance**: Ensure new endpoint doesn't impact response time of existing APIs
3. **Security**: Verify JWT implementation follows existing patterns
4. **Logging**: Maintain existing audit logging standards
5. **Database**: No new database tables needed for this feature

## Definition of Done
- [ ] Endpoint implements JWT authentication correctly
- [ ] Session creation completes within 3 seconds
- [ ] Returns properly formatted JSON response
- [ ] All error cases handled with standard format
- [ ] Tests written and passing in sara_tests
- [ ] JSDoc documentation complete
- [ ] Code review completed
- [ ] No hardcoded secrets or credentials