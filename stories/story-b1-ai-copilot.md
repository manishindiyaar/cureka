<[
\---
title: "Story B1: AI Copilot Query Endpoint"
epic: "Epic B: AI Copilot & Session Management"
priority: "Medium"
status: "Draft"
as_a: "A user in any role"
so_i_can: "Submit natural language queries"
in_order_to: "Get AI assistance through the copilot"
---

## Story
As a user in any role (Patient, Doctor, Pharmacist, or Admin), I want to submit natural language queries so that I can get AI assistance through the Claude-powered copilot system.

## Acceptance Criteria
1. **Query Validation**
   - Accepts text query (min 3 characters, max 1000)
   - Validates user authentication (valid JWT)
   - Returns 401 for unauthenticated requests
   - Returns 422 for invalid query format

2. **User Context Integration**
   - Adds user metadata to prompt:
     - User role (Patient/Doctor/Pharmacist/Admin)
     - Hospital ID
     - User preferences (if any)
   ```typescript
   const user_context = {
     role: req.user.role,
     hospital_id: req.user.hospital_id,
     user_id: req.user.id,
     language_preference: req.user.language_preference || 'en'
   };
   ```

3. **Claude API Integration**
   - Sends structured prompt to Anthropic Claude API
   - Handles rate limiting (10 requests per minute per user)
   - Manages API failures with exponential backoff
   - Returns timeout after 30 seconds

4. **Session Persistence**
   - Creates new conversation session
   - Stores:
     - Conversation ID
     - User query
     - AI response
     - Function calls (if any)
     - Start/End timestamps
   - Links to user_id for audit trail

5. **Success Response**
   ```json
   {
     "success": true,
     "data": {
         "session_id": "sess_abc123",
         "response": "I can help you schedule an appointment with Dr. Patel...",
         "function_calls": [
           {
             "name": "get_doctor_schedule",
             "parameters": {"doctor_name": "Dr. Patel"}
           }
         ],
         "metadata": {
           "tokens_in": 45,
           "tokens_out": 120,
           "model": "claude-3-sonnet-20240229",
           "confidence": 0.94
         }
     }
   }
   ```

## Technical Context

### Key Dependencies
```bash
npm install @anthropic-ai/sdk express-rate-limit express-async-handler async redis
```

### Key Files to Create
```
apps/api/src/
├── services/
│   ├── claude-ai.service.ts
│   ├── session.service.ts
│   └── prompt-builder.service.ts
├── api/v1/sessions/
│   ├── copilot-controller.ts
│   ├── copilot-service.ts
│   └── copilot-validation.ts
└── helpers/
    └── prompt-templates.ts
```

### Environment Variables
```bash
# Claude AI Configuration
CLAUDE_API_KEY=sk-ant-api03-your-key-here
CLAUDE_MAX_TOKENS=1000
CLAUDE_TIMEOUT_MS=30000
CLAUDE_RATE_LIMIT_PER_MINUTE=10
CLAUDE_ENDPOINT=https://api.anthropic.com/v1/messages

# Context Management
MAX_CONVERSATION_HISTORY=10
SESSION_EXPIRY_HOURS=24

# System Context
SYSTEM_CONTEXT="You are a helpful healthcare assistant..."
```

### Claude API Prompt Structure
```typescript
// apps/api/src/helpers/prompt-templates.ts
export const buildCopilotPrompt = (query: string, userContext: UserContext): string => {
  const system_prompt = `You are a helpful healthcare assistant for Cureka Health Platform.
Patient queries: Provide appointment booking assistance, medication reminders, symptom checking
Doctor queries: Help with diagnosis support, treatment recommendations, scheduling
Pharmacist queries: Assist with prescription validation, availability checking

Always:
- Be patient and empathetic
- Ask for clarification when needed
- Be concise but comprehensive
- Use simple language for patients

You have access to these functions:
${AVAILABLE_FUNCTIONS}

User context:
- Role: ${userContext.role}
- Hospital: ${userContext.hospital_name}
`;

  return `${system_prompt}

User query: ${query}

Response:`;
};
```

## Implementation Steps

### Step 1: Request Validation
```typescript
// apps/api/src/api/v1/sessions/copilot-validation.ts
export const copilotValidation = [
  body('query')
    .isLength({ min: 3, max: 1000 })
    .withMessage('Query must be between 3 and 1000 characters')
    .escape(),
  body('session_id')
    .optional()
    .isUUID(4)
    .withMessage('Session ID must be valid UUID'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object')
];
```

### Step 2: Rate Limiting
```typescript
// apps/api/src/api/v1/sessions/copilot-controller.ts
const copilotRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `copilot:${req.user.id}`
});
```

### Step 3: Claude Service Implementation
```typescript
// apps/api/src/services/claude-ai.service.ts
export class ClaudeService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
  }

  async processQuery(query: string, userContext: UserContext, sessionId?: string): Promise<AIResponse> {
    try {
      const prompt = buildCopilotPrompt(query, userContext);

      const response = await this.client.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '1000'),
        messages: [{ role: "user", content: prompt }],
        tools: AVAILABLE_TOOLS
      });

      // Process function calls if any
      const functionCalls = this.extractFunctionCalls(response.content);

      // Serialize response
      return {
        response: this.extractTextContent(response.content),
        function_calls: functionCalls,
        metadata: {
          tokens_in: response.usage.input_tokens,
          tokens_out: response.usage.output_tokens,
          model: "claude-3-sonnet-20240229"
        }
      };

    } catch (error) {
      logger.error('Claude API error:', error);
      throw new AIProcessingError('Failed to process query');
    }
  }

  private extractFunctionCalls(content: any[]): FunctionCall[] {
    return content.filter(item => item.type === 'tool_use').map(tool => ({
      id: tool.id,
      name: tool.name,
      parameters: tool.input,
      confirmation_required: ['book_appointment', 'write_prescription'].includes(tool.name)
    }));
  }

  private extractTextContent(content: any[]): string {
    const textItems = content.filter(item => item.type === 'text');
    return textItems.map(item => item.text).join(' ');
  }
}
```

### Step 4: Session Management
```typescript
// apps/api/src/services/session.service.ts
export class SessionService {
  async createSession(userId: string, query: string, response: AIResponse): Promise<string> {
    const sessionId = `sess_${Date.now()}_${randomUUID()}`;
    const sessionData = {
      id: sessionId,
      user_id: userId,
      type: 'copilot',
      metadata: {
        start_time: new Date(),
        user_query: query,
        ai_response: response.response,
        function_calls: response.function_calls || [],
        tokens_used: response.metadata.tokens_in + response.metadata.tokens_out,
        model_used: response.metadata.model
      }
    };

    try {
      await redis.setex(`session:${sessionId}`, 24 * 60 * 60, JSON.stringify(sessionData)); // 24h

      // Also save to Supabase for long-term storage
      await supabase
        .from('ai_sessions')
        .insert({
          id: sessionId,
          user_id: userId,
          type: 'copilot',
          conversation_data: sessionData.metadata
        });

      return sessionId;
    } catch (error) {
      logger.error('Session creation failed:', error);
      throw new SessionError('Failed to create session');
    }
  }

  async getConversationHistory(sessionId: string, userId: string): Promise<any[]> {
    const rawHistory = await redis.lrange(`session_history:${sessionId}`, 0, -1);
    return rawHistory.map(item => JSON.parse(item));
  }
}
```

### Step 5: Context Builder
```typescript
// apps/api/src/services/context-builder.service.ts
export const buildUserContext = async (userId: string, role: string, hospitalId?: string): Promise<UserContext> => {
  // Get user details from database
  const { data: user, error } = await supabase
    .from('users')
    .select('*, hospitals(name)')
    .eq('id', userId)
    .single();

  if (error) {
    logger.error('Failed to fetch user context:', error);
    throw new ContextError('Unable to build user context');
  }

  // Get recent conversation context (last 5 messages)
  const recentContext = await sessionService.getRecentContext(userId, 5);

  // Get hospital-specific info
  let hospitalContext = null;
  if (hospitalId) {
    const hospitalsResult = await supabase
      .from('hospitals')
      .select('*')
      .eq('id', hospitalId)
      .single();
    hospitalContext = hospitalsResult.data;
  }

  return {
    user_id: userId,
    role: role,
    hospital: hospitalContext,
    user_preferences: user.preferences || {},
    context_history: recentContext,
    timestamp: new Date()
  };
};
```

## Testing Requirements

### Test Structure
```
apps/api/tests/sessions/
├── copilot.test.ts
├── copilot.int.test.ts
└── fixtures/
    ├── ai-responses.ts
    └── mock-contexts.ts
```

### Key Test Cases
```typescript
describe('POST /api/v1/sessions/copilot', () => {
  describe('Given valid authenticated request', () => {
    it('should return AI response with session ID', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'I can help you find a cardiologist...' }],
        usage: { input_tokens: 45, output_tokens: 120 }
      };

      jest.mocked(claudeService.processQuery).mockResolvedValue(
        new AIResponse('I can help you...', [], { tokens_in: 45, tokens_out: 120 })
      );

      const response = await request(app)
        .post('/api/v1/sessions/copilot')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          query: 'Can you help me find a cardiologist?'
        })
        .expect(200);

      expect(response.body.data.response).toContain('I can help you');
      expect(response.body.data.session_id).toBeDefined();
      expect(response.body.success).toBe(true);
    });
  });

  describe('Given invalid query', () => {
    it('should return 422 for empty query', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/copilot')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ query: '' })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Given rate limit exceeded', () => {
    it('should return 429 after 10 requests per minute', async () => {
      // Make 10 requests quickly
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/v1/sessions/copilot')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ query: `Query ${i}` });
      }

      // 11th should be rate limited
      const response = await request(app)
        .post('/api/v1/sessions/copilot')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ question: 'Rate limit test' })
        .expect(429);

      expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Given Claude API error', () => {
    it('should return 503 service unavailable', async () => {
      jest.mocked(claudeService.processQuery).mockRejectedValue(new Error('AI Service Error'));

      const response = await request(app)
        .post('/api/v1/sessions/copilot')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ query: 'Any query' })
        .expect(503);

      expect(response.body.code).toBe('AI_PROCESSING_ERROR');
    });
  });
});
```

### Performance Tests
- Response time must be <200ms for cache hits
- Claude API timeout handled gracefully (<30s)
- Rate limiting happens in <20ms

## Function Call Examples
```typescript
export const AVAILABLE_FUNCTIONS = [
  {
    name: 'get_doctor_schedule',
    description: 'Get availability of a specific doctor',
    parameters: {
      type: 'object',
      properties: {
        doctor_name: { type: 'string', description: 'Name of the doctor' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' }
      },
      required: ['doctor_name']
    }
  },
  {
    name: 'book_appointment',
    description: 'Book an appointment with a doctor',
    parameters: {
      type: 'object',
      properties: {
        doctor_id: { type: 'string', description: 'Doctor ID' },
        patient_id: { type: 'string', description: 'Patient ID' },
        datetime: { type: 'string', description: 'DateTime in ISO format' },
        appointment_type: {
          type: 'string',
          enum: ['consultation', 'followup', 'emergency']
        }
      },
      required: ['doctor_id', 'datetime', 'appointment_type']
    }
  }
];
```

## Error Handling
```typescript
const COPILOT_ERROR_CODES = {
  RATE_LIMIT_EXCEEDED: { code: 'RATE_LIMIT_EXCEEDED', status: 429 },
  AI_PROCESSING_ERROR: { code: 'AI_PROCESSING_ERROR', status: 503 },
  SESSION_ERROR: { code: 'SESSION_ERROR', status: 500 },
  CONTEXT_ERROR: { code: 'CONTEXT_ERROR', status: 400 },
  TIMEOUT: { code: 'TIMEOUT_ERROR', status: 408 }
};

export class CopilotError extends Error {
  constructor(public code: keyof typeof COPILOT_ERROR_CODES, message?: string) {
    super(message || 'Copilot processing failed');
    this.name = 'CopilotError';
  }
}
```

## Cost Optimization
- Implement user quotas per day (100 questions)
- Cache common responses
- Use streaming for long responses
- Rate limit aggressively (protect AI costs)

## Post-Implementation Checklist
- [ ] Claude API integration working
- [ ] Rate limiting functional
- [ ] Session persistence to Redis
- [ ] Function calling implemented
- [ ] User context properly integrated
- [ ] Performance benchmarks met
- [ ] Error handling complete
- [ ] All tests pass with >90% coverage]>