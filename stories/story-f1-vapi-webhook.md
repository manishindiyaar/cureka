<[
\---
title: "Story F1: Vapi.ai Webhook Handler"
epic: "Epic F: External Service Webhooks"
priority: "Medium"
status: "Draft"
as_a: "The Vapi.ai voice service"
so_i_can: "Send conversation data after calls end"
in_order_to: "Enable the system to store call transcripts and metadata"
---

## Story
As the Vapi.ai voice service, I want to send conversation data after calls end so that the system can store call transcripts and metadata for patient records.

## Acceptance Criteria
1. **Webhook Authentication**
   - Validates webhook signature using VAPI_WEBHOOK_SECRET
   - Uses HMAC-SHA256 signature verification
   - Returns 401 for invalid signatures
   - Logs unauthorized attempts for security audit

2. **Payload Validation**
   - Accepts JSON payload with required fields:
     - call_id, phone_number, conversation_data, timestamp
   - Validates phone_number format (E.164)
   - Ensures conversation_data contains transcript and metadata
   - Returns 400 for invalid/malformed payloads

3. **Data Processing**
   - Creates new AI session record in database
   - Links to existing patient by phone number (if matches)
   - Stores conversation transcript securely (encrypted)
   - Extracts key information (intent, symptoms, actions)
   - Sets session type as 'VOICE_CALL'

4. **Response Format**
   ```json
   {
     "success": true,
     "data": {
       "session_id": "sess_vapi_1234567890",
       "status": "processed",
       "links": {
         "session_details": "/api/v1/ai_sessions/sess_vapi_1234567890"
       }
     }
   }
   ```

## Technical Context

### Key Dependencies
```bash
npm install crypto express-rate-limit node-cache joi helmet
```

### Key Files to Create
```
apps/api/src/
├── api/v1/webhooks/
│   ├── vapi-webhook.controller.ts
│   ├── vapi-webhook.service.ts
│   ├── vapi-webhook.validation.ts
│   └── vapi-webhook.interface.ts
├── services/
│   ├── webhook-auth.service.ts
│   └── ai-session.service.ts
└── middleware/
    └── webhook-auth.middleware.ts
```

### Vapi.ai Webhook Payload Structure
```typescript
interface VapiWebhookPayload {
  call_id: string;              // Unique Vapi call ID
  phone_number: string;         // Patient's phone number (E.164)
  conversation_data: {
    transcript: Array<{
      role: 'assistant' | 'user';
      content: string;
      timestamp: string;
    }>;
    metadata: {
      duration_seconds: number;
      started_at: string;
      ended_at: string;
      recording_url?: string;
      summary?: string;
      intent?: string;
      extracted_info?: {
        symptoms?: string[];
        medications?: string[];
        follow_up_needed?: boolean;
        urgency?: 'low' | 'medium' | 'high';
      }
    }
  };
  timestamp: string;            // Webhook trigger time
  signature?: string;           // HMAC signature for verification
}
```

### Environment Variables
```bash
# Vapi Webhook Configuration
VAPI_WEBHOOK_SECRET=super-secret-webhook-key-here
VAPI_WEBHOOK_URL=https://api.cureka.health/webhooks/vapi
VAPI_SIGNATURE_HEADER=vapi-signature

# Processing Settings
VAPI_WEBHOOK_TIMEOUT_MS=30000
VAPI_RATE_LIMIT_PER_MINUTE=60
VAPI_PAYLOAD_MAX_SIZE=2MB

# Storage Settings
ENCRYPT_CALL_TRANSCRIPTS=true
CALL_TRANSCRIPT_ENCRYPTION_KEY=32-char-encryption-key-here
RETAIN_RECORDING_URLS_DAYS=30
```

## Implementation Steps

### Step 1: Webhook Authentication Middleware
```typescript
// apps/api/src/middleware/webhook-auth.middleware.ts
import * as crypto from 'crypto';

export class WebhookAuthMiddleware {
  static validateVapiSignature(req: Request, res: Response, next: NextFunction) {
    const signature = req.headers['vapi-signature'] as string;
    const payload = JSON.stringify(req.body);
    const secret = process.env.VAPI_WEBHOOK_SECRET;

    if (!signature || !secret) {
      logger.warn('Vapi webhook missing signature or secret');
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Missing webhook signature'
      });
    }

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      logger.warn('Vapi webhook signature validation failed');
      // Log failed attempt for security monitoring
      securityLogger.logUnauthorizedWebhookAttempt({
        source: 'vapi',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      });

      return res.status(401).json({
        success: false,
        code: 'INVALID_SIGNATURE',
        message: 'Webhook signature validation failed'
      });
    }

    next();
  }
}
```

### Step 2: Payload Validation Schema
```typescript
// apps/api/src/api/v1/webhooks/vapi-webhook.validation.ts
import Joi from 'joi';

export const vapiWebhookSchema = Joi.object({
  call_id: Joi.string().required().min(1).max(100),
  phone_number: Joi.string().pattern(/^\+91\d{10}$/).required(), // India E.164
  conversation_data: Joi.object({
    transcript: Joi.array().items(
      Joi.object({
        role: Joi.string().valid('assistant', 'user').required(),
        content: Joi.string().required().max(1000),
        timestamp: Joi.string().isoDate().required()
      })
    ).required().min(1),
    metadata: Joi.object({
      duration_seconds: Joi.number().integer().min(0).max(7200), // 2 hours max
      started_at: Joi.string().isoDate().required(),
      ended_at: Joi.string().isoDate().required(),
      recording_url: Joi.string().uri().optional(),
      summary: Joi.string().max(1000).optional(),
      intent: Joi.string().max(200).optional(),
      extracted_info: Joi.object({
        symptoms: Joi.array().items(Joi.string().max(100)).optional(),
        medications: Joi.array().items(Joi.string().max(100)).optional(),
        follow_up_needed: Joi.boolean().optional(),
        urgency: Joi.string().valid('low', 'medium', 'high').optional()
      }).optional()
    }).required()
  }).required(),
  timestamp: Joi.string().isoDate().required()
});

// Rate limiting specifically for Vapi webhooks
export const vapiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.VAPI_RATE_LIMIT_PER_MINUTE || '60'),
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many Vapi webhook requests'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: () => 'vapi-webhook' // All Vapi requests share this key
});
```

### Step 3: Webhook Controller
```typescript
// apps/api/src/api/v1/webhooks/vapi-webhook.controller.ts
export class VapiWebhookController {
  private vapiService = new VapiWebhookService();
  private cache = new NodeCache({ stdTTL: 300 }); // 5-minute cache

  async handleVapiWebhook(req: Request, res: Response) {
    try {
      // Validate payload against schema
      const { error, value: payload } = vapiWebhookSchema.validate(req.body);
      if (error) {
        logger.warn('Invalid Vapi webhook payload', { error: error.details });
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Invalid webhook payload',
          details: error.details
        });
      }

      // Check for duplicate processing (using call_id)
      const cacheKey = `vapi_call_${payload.call_id}`;
      if (this.cache.has(cacheKey)) {
        logger.info('Duplicate Vapi webhook received', { call_id: payload.call_id });
        return res.status(200).json({
          success: true,
          data: {
            session_id: this.cache.get(cacheKey),
            status: 'already_processed'
          }
        });
      }

      // Process the webhook data
      const session = await this.vapiService.processWebhookData(payload);

      // Cache successful processing
      this.cache.set(cacheKey, session.id);

      // Return success response
      return res.status(200).json({
        success: true,
        data: {
          session_id: session.id,
          status: 'processed',
          links: {
            session_details: `/api/v1/ai_sessions/${session.id}`
          }
        }
      });

    } catch (error) {
      logger.error('Vapi webhook processing failed', error);

      // Return appropriate error response
      if (error instanceof WebhookError) {
        return res.status(error.status).json({
          success: false,
          code: error.code,
          message: error.message
        });
      }

      // Generic error response
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Failed to process Vapi webhook'
      });
    }
  }
}
```

### Step 4: Webhook Service Logic
```typescript
// apps/api/src/api/v1/webhooks/vapi-webhook.service.ts
export class VapiWebhookService {
  private encryptionService = new EncryptionService();
  private aiSessionService = new AISessionService();

  async processWebhookData(payload: VapiWebhookPayload): Promise<AISession> {
    // 1. Find or create patient by phone number
    const patient = await this.findOrCreatePatientByPhone(payload.phone_number);

    // 2. Extract conversation summary and key information
    const conversationSummary = this.extractConversationSummary(payload.conversation_data);
    const keyInfo = this.extractKeyInformation(payload.conversation_data);

    // 3. Encrypt sensitive conversation data
    const encryptedTranscript = process.env.ENCRYPT_CALL_TRANSCRIPTS === 'true'
      ? this.encryptionService.encrypt(JSON.stringify(payload.conversation_data.transcript))
      : null;

    // 4. Create AI session record
    const sessionData = {
      id: `sess_vapi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: patient?.id || null,
      type: 'VOICE_CALL',
      source: 'VAPI',
      metadata: {
        call_id: payload.call_id,
        phone_number: payload.phone_number,
        duration_seconds: payload.conversation_data.metadata.duration_seconds,
        started_at: payload.conversation_data.metadata.started_at,
        ended_at: payload.conversation_data.metadata.ended_at,
        summary: conversationSummary,
        key_info: keyInfo,
        recording_url: this.sanitizeRecordingUrl(payload.conversation_data.metadata.recording_url),
        intent: payload.conversation_data.metadata.intent
      },
      conversation_data: {
        transcript: encryptedTranscript,
        raw_data: null // Don't store raw data unless needed
      },
      created_at: new Date(payload.timestamp),
      status: 'PROCESSED'
    };

    // 5. Save to database
    const session = await this.aiSessionService.createSession(sessionData);

    // 6. Trigger follow-up actions (notifications, appointment suggestions, etc.)
    await this.processFollowUpActions(session, keyInfo);

    return session;
  }

  private async findOrCreatePatientByPhone(phoneNumber: string): Promise<User | null> {
    // Look for existing patient
    const { data: existingPatient } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('role', 'PATIENT')
      .single();

    if (existingPatient) {
      return existingPatient;
    }

    // Create new patient record if needed
    // This is optional and depends on business requirements
    return null;
  }

  private extractConversationSummary(conversationData: any): string {
    // Simple extraction - in production, this might use AI summarization
    if (conversationData.metadata.summary) {
      return conversationData.metadata.summary;
    }

    // Basic fallback summary
    const userMessages = conversationData.transcript
      .filter((msg: any) => msg.role === 'user')
      .map((msg: any) => msg.content)
      .join(' ');

    return userMessages.substring(0, 200) + (userMessages.length > 200 ? '...' : '');
  }

  private extractKeyInformation(conversationData: any): any {
    return conversationData.metadata.extracted_info || {
      symptoms: [],
      medications: [],
      follow_up_needed: false,
      urgency: 'medium'
    };
  }

  private sanitizeRecordingUrl(url: string | undefined): string | null {
    if (!url) return null;

    // Only retain URLs for a limited time for privacy
    const retentionDays = parseInt(process.env.RETAIN_RECORDING_URLS_DAYS || '30');
    const now = new Date();
    const expiryDate = new Date(now.setDate(now.getDate() + retentionDays));

    return expiryDate > new Date() ? url : null;
  }

  private async processFollowUpActions(session: AISession, keyInfo: any): Promise<void> {
    // Trigger notifications if urgent
    if (keyInfo.urgency === 'high') {
      await notificationService.sendUrgentCareNotification(session);
    }

    // Suggest appointments if needed
    if (keyInfo.follow_up_needed) {
      await appointmentService.suggestAppointment(session.user_id, keyInfo.symptoms);
    }

    // Log symptoms for health tracking
    if (keyInfo.symptoms && keyInfo.symptoms.length > 0) {
      await healthTrackingService.logSymptoms(session.user_id, keyInfo.symptoms);
    }
  }
}
```

## Testing Requirements

### Test Structure
```
apps/api/tests/webhooks/
├── vapi-webhook.test.ts
├── vapi-authentication.test.ts
├── vapi-payload-validation.test.ts
└── mocks/
    ├── vapi-payload.mock.ts
    └── signature.mock.ts
```

### Key Test Cases
```typescript
describe('POST /api/v1/webhooks/vapi', () => {
  describe('Webhook Authentication', () => {
    it('should reject requests with invalid signatures', async () => {
      const invalidSignature = 'invalid-hmac-signature';

      const response = await request(app)
        .post('/api/v1/webhooks/vapi')
        .set('vapi-signature', invalidSignature)
        .send(validVapiPayload)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_SIGNATURE');
    });

    it('should accept requests with valid signatures', async () => {
      const validSignature = generateValidSignature(validVapiPayload);

      const response = await request(app)
        .post('/api/v1/webhooks/vapi')
        .set('vapi-signature', validSignature)
        .send(validVapiPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session_id).toBeDefined();
    });
  });

  describe('Payload Validation', () => {
    it('should reject malformed payloads', async () => {
      const malformedPayload = {
        ...validVapiPayload,
        call_id: null, // Missing required field
        phone_number: 'invalid-format' // Invalid format
      };

      const response = await request(app)
        .post('/api/v1/webhooks/vapi')
        .set('vapi-signature', validSignature)
        .send(malformedPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid payloads', async () => {
      const response = await request(app)
        .post('/api/v1/webhooks/vapi')
        .set('vapi-signature', validSignature)
        .send(validVapiPayload)
        .expect(200);

      expect(response.body.data.session_id).toMatch(/^sess_vapi_/);
      expect(response.body.data.status).toBe('processed');
    });
  });

  describe('Duplicate Handling', () => {
    it('should handle duplicate webhook requests', async () => {
      const signature = generateValidSignature(validVapiPayload);

      // First request
      const firstResponse = await request(app)
        .post('/api/v1/webhooks/vapi')
        .set('vapi-signature', signature)
        .send(validVapiPayload);

      // Second request with same call_id
      const secondResponse = await request(app)
        .post('/api/v1/webhooks/vapi')
        .set('vapi-signature', signature)
        .send(validVapiPayload)
        .expect(200);

      expect(secondResponse.body.data.status).toBe('already_processed');
      expect(secondResponse.body.data.session_id).toBe(firstResponse.body.data.session_id);
    });
  });

  describe('Data Processing', () => {
    it('should create AI session with encrypted transcript', async () => {
      const signature = generateValidSignature(validVapiPayload);

      const response = await request(app)
        .post('/api/v1/webhooks/vapi')
        .set('vapi-signature', signature)
        .send(validVapiPayload)
        .expect(200);

      // Verify session was created in database
      const { data: session } = await supabase
        .from('ai_sessions')
        .select('*')
        .eq('id', response.body.data.session_id)
        .single();

      expect(session).toBeDefined();
      expect(session.type).toBe('VOICE_CALL');
      expect(session.source).toBe('VAPI');
      expect(session.metadata.call_id).toBe(validVapiPayload.call_id);

      // Verify transcript is encrypted
      if (process.env.ENCRYPT_CALL_TRANSCRIPTS === 'true') {
        expect(session.conversation_data.transcript).not.toContain('assistant');
        expect(session.conversation_data.transcript).not.toContain('user');
      }
    });
  });
});
```

### Mock Data for Testing
```typescript
// apps/api/tests/mocks/vapi-payload.mock.ts
export const validVapiPayload = {
  call_id: "call_1234567890abcdef",
  phone_number: "+919876543210",
  conversation_data: {
    transcript: [
      {
        role: "assistant",
        content: "Hello, this is Cureka Health. How can I help you today?",
        timestamp: "2025-09-21T10:00:00Z"
      },
      {
        role: "user",
        content: "I've been having fever and body aches for the past 3 days",
        timestamp: "2025-09-21T10:00:15Z"
      }
    ],
    metadata: {
      duration_seconds: 120,
      started_at: "2025-09-21T10:00:00Z",
      ended_at: "2025-09-21T10:02:00Z",
      summary: "Patient reporting fever and body aches for 3 days",
      intent: "medical_consultation",
      extracted_info: {
        symptoms: ["fever", "body aches"],
        follow_up_needed: true,
        urgency: "medium"
      }
    }
  },
  timestamp: "2025-09-21T10:02:05Z"
};

export const generateValidSignature = (payload: any): string => {
  const secret = process.env.VAPI_WEBHOOK_SECRET || 'test-secret';
  return crypto.createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
};
```

## Error Handling
```typescript
export enum VapiWebhookErrorCode {
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  DUPLICATE_REQUEST = 'DUPLICATE_REQUEST',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export class WebhookError extends Error {
  constructor(
    public code: VapiWebhookErrorCode,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'VapiWebhookError';
  }
}
```

## Security Considerations
1. **Signature Validation**: HMAC-SHA256 prevents unauthorized webhook submissions
2. **Rate Limiting**: Prevents DoS attacks on webhook endpoint
3. **Duplicate Prevention**: Cache prevents double-processing of same call
4. **Data Encryption**: Sensitive transcripts encrypted at rest
5. **Input Validation**: Strict schema validation prevents injection attacks
6. **Audit Logging**: Unauthorized attempts logged for security monitoring
7. **Timeout Handling**: 30-second timeout prevents resource exhaustion

## Performance Optimization
1. **Caching**: Node-cache for duplicate detection
2. **Async Processing**: Non-blocking webhook handling
3. **Connection Pooling**: Supabase connection reuse
4. **Payload Size Limits**: 2MB maximum to prevent abuse
5. **Background Jobs**: Follow-up actions processed asynchronously

## Post-Implementation Checklist
- [ ] Webhook signature validation working
- [ ] Rate limiting correctly configured
- [ ] Duplicate request handling functional
- [ ] Data encryption for transcripts
- [ ] Patient linking by phone number
- [ ] Follow-up action triggering
- [ ] Error logging and monitoring
- [ ] Performance under load (<200ms)
- [ ] All tests pass with >90% coverage
- [ ] Security audit logging implemented
- [ ] Recording URL sanitization
- [ ] Integration with AI session service>