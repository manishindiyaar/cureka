<[
\---
title: "Story A2: Patient OTP Verification"
epic: "Epic A: Authentication & User Management"
priority: "High"
status: "Completed"
as_a: "A patient who has requested an OTP"
so_i_can: "Submit the received OTP code"
in_order_to: "Complete my authentication and get an access token"
---

## Story
As a patient who has requested an OTP, I want to submit the received OTP code so that I can complete my authentication and get an access token.

## Acceptance Criteria
1. **OTP Code Validation**
   - Accepts 4-digit numeric OTP code
   - Validates OTP is not expired (5 minutes)
   - Returns 400 for invalid format
   - Returns 400 for expired OTP
   - Single-use OTP (deleted after verification)

2. **OTP Verification**
   - Verifies OTP against stored code in otps table
   - On successful verification:
     - Deletes OTP from database (single-use)
     - Creates new user record in Supabase (if first login)
     - Updates existing user last login timestamp
   - On failed verification:
     - Returns clear error messages
     - Limits failed attempts to 5 per session

3. **JWT Token Generation**
   - Generates access token with 24-hour expiration
   - Generates refresh token with 7-day expiration
   - Token payload includes user_id and role
   - Tokens are signed with JWT_SECRET from environment

4. **Response Format**
   ```json
   {
     "success": true,
     "data": {
       "user": {
         "user_id": "uuid",
         "phone_number": "+919876543210",
         "full_name": "Rajesh Kumar" // or null if new user
       },
       "access_token": "eyJhbGc...",
       "refresh_token": "eyJhbGc...",
       "token_type": "Bearer",
       "expires_in": 86400
     }
   }
   ```

## Technical Context

### Key Dependencies
```bash
npm install twilio jsonwebtoken bcryptjs @supabase/supabase-js express-validator express-rate-limit
```

### Key Files to Create/Modify
- `apps/api/src/services/otp-verify.service.ts`
- `apps/api/src/services/token.service.ts`
- `apps/api/src/api/v1/auth/patient/otp-verify.controller.ts`
- `apps/api/src/api/v1/auth/patient/patient.service.ts`
- `apps/api/src/middleware/error-handler.ts`

### Database Schema
```sql
-- Users table (existing)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(15) UNIQUE,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'patient',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- OTPs table (new)
CREATE TABLE otps (
    id BIGSERIAL PRIMARY KEY,
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for quick lookups
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_otps_phone_number ON otps(phone_number);
```

### Request Validation
```typescript
export const verifyOtpValidation = [
  body('phone_number').isMobilePhone('any').withMessage('Phone number must be valid'),
  body('otp_code').isNumeric().isLength({ min: 4, max: 4 }).withMessage('OTP must be 4 digits')
];
```

### Environment Variables Required
```
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
OTP_EXPIRY_MINUTES=5
MAX_OTP_ATTEMPTS=5
```

## Implementation Steps

### Step 1: Create Validation Middleware
```typescript
export const validatePhoneNumber = (phone: string): boolean => {
  // E.164 format regex for Indian numbers
  const phoneRegex = /^\+91\d{10}$/;
  return phoneRegex.test(phone);
};

export const validateOTP = (otp: string): boolean => {
  // Must be exactly 4 digits
  return /^\d{4}$/.test(otp);
};
```

### Step 2: OTP Verification Logic
```typescript
export class OtpVerificationService {
  static async verifyOtp(phoneNumber: string, otpCode: string): Promise<boolean> {
    // Get OTP from database
    const { data: storedOtp, error } = await supabase
      .from('otps')
      .select('otp_code, created_at')
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !storedOtp) {
      throw new Error('Invalid or expired OTP');
    }

    // Check if OTP is expired
    const createdTime = new Date(storedOtp.created_at);
    const expiryTime = new Date(createdTime.getTime() + (parseInt(process.env.OTP_EXPIRY_MINUTES || '5') * 60000));
    if (new Date() > expiryTime) {
      // Delete expired OTP
      await supabase.from('otps').delete().eq('phone_number', phoneNumber);
      throw new Error('OTP has expired');
    }

    // Check if OTP matches
    const isValid = await bcrypt.compare(otpCode, storedOtp.otp_code);
    if (!isValid) {
      throw new Error('Invalid OTP');
    }

    // Delete OTP after successful verification (single-use)
    await supabase.from('otps').delete().eq('phone_number', phoneNumber);

    return true;
  }
}
```

### Step 3: Build Token Service
```typescript
export class TokenService {
  static generateTokens(user: any) {
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, tokenType: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }
}
```

### Step 4: User Creation Logic
```typescript
export class PatientAuthService {
  static async createUserIfNotExists(phoneNumber: string): Promise<any> {
    // Check if user exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingUser && !selectError) {
      // Update last login timestamp
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ last_login: new Date() })
        .eq('id', existingUser.id)
        .select()
        .single();

      return updatedUser;
    }

    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        phone_number: phoneNumber,
        role: 'patient',
        created_at: new Date(),
        last_login: new Date()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error('Failed to create user');
    }

    return newUser;
  }
}
```

### Step 5: Controller Implementation
```typescript
export class OtpVerifyController {
  static async verifyOtp(req: Request, res: Response) {
    try {
      const { phone_number, otp_code } = req.body;

      // Validate inputs
      if (!validatePhoneNumber(phone_number) || !validateOTP(otp_code)) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Invalid phone number or OTP format'
        });
      }

      // Verify OTP
      await OtpVerificationService.verifyOtp(phone_number, otp_code);

      // Create or get user
      const user = await PatientAuthService.createUserIfNotExists(phone_number);

      // Generate tokens
      const { accessToken, refreshToken } = TokenService.generateTokens(user);

      // Return success response
      return res.status(200).json({
        success: true,
        data: {
          user: {
            user_id: user.id,
            phone_number: user.phone_number,
            full_name: user.full_name || null
          },
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: 86400
        }
      });

    } catch (error) {
      // Handle specific errors
      if (error.message === 'Invalid or expired OTP' || error.message === 'OTP has expired') {
        return res.status(400).json({
          success: false,
          code: 'INVALID_OTP',
          message: error.message
        });
      }

      // Generic error
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify OTP'
      });
    }
  }
}
```

## Testing Requirements

### Unit Tests Coverage
```typescript
describe('OTP Verification', () => {
  beforeEach(async () => {
    // Clear test data
    await supabase.from('otps').delete().neq('id', 0);
    await supabase.from('users').delete().neq('id', 0);
  });

  it('should accept valid 4-digit OTP', async () => {
    // Insert test OTP
    const phoneNumber = '+919876543210';
    const otpCode = '1234';
    const hashedOtp = await bcrypt.hash(otpCode, 10);

    await supabase.from('otps').insert({
      phone_number: phoneNumber,
      otp_code: hashedOtp
    });

    const response = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone_number: phoneNumber, otp_code: otpCode });

    expect(response.status).toBe(200);
    expect(response.body.data.access_token).toBeDefined();
    expect(response.body.success).toBe(true);
  });

  it('should reject invalid OTP format', async () => {
    const response = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone_number: '+919876543210', otp_code: '123a' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('should reject expired OTP', async () => {
    // Insert expired OTP (6 minutes old)
    const phoneNumber = '+919876543210';
    const otpCode = '1234';
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);

    await supabase.from('otps').insert({
      phone_number: phoneNumber,
      otp_code: hashedOtp,
      created_at: sixMinutesAgo
    });

    const response = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone_number: phoneNumber, otp_code: otpCode });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('INVALID_OTP');
  });

  it('should create new user on first login', async () => {
    // Insert test OTP
    const phoneNumber = '+919876543210';
    const otpCode = '1234';
    const hashedOtp = await bcrypt.hash(otpCode, 10);

    await supabase.from('otps').insert({
      phone_number: phoneNumber,
      otp_code: hashedOtp
    });

    const response = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone_number: phoneNumber, otp_code: otpCode });

    expect(response.status).toBe(200);

    // Verify user was created
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    expect(user).toBeDefined();
    expect(user.phone_number).toBe(phoneNumber);
    expect(user.role).toBe('patient');
  });
});
```

### Test File Location
`apps/api/tests/auth/patient-otp-verify.test.ts`

### Integration Tests
- OTP storage and retrieval
- Token generation validation
- Database transaction verification
- User creation and update logic
- OTP cleanup after use

## Error Codes
```typescript
const ERROR_CODES = {
  VALIDATION_ERROR: 'validation_error',
  INVALID_OTP: 'invalid_otp',
  EXPIRED_OTP: 'expired_otp',
  MAX_ATTEMPTS_EXCEEDED: 'max_attempts_exceeded',
  USER_CREATION_FAILED: 'user_creation_failed',
  JWT_GENERATION_FAILED: 'jwt_generation_failed',
  INTERNAL_ERROR: 'internal_error'
};
```

## Security Considerations
1. **Single-Use OTPs**: OTPs are deleted after verification
2. **Rate Limiting**: Maximum 5 failed attempts per phone number per hour
3. **Audit Logging**: Log all verification attempts (success/failure)
4. **Token Security**: Access tokens expire in 24h, refresh in 7 days
5. **HTTPS Only**: Enforce HTTPS in production via helmet configuration
6. **OTP Expiry**: 5-minute expiry for all OTPs
7. **Hashed Storage**: OTPs stored as bcrypt hashes

## Performance Requirements
- API endpoint must complete in <200ms for 95th percentile
- Database queries optimized with indexes
- JWT generation must be <10ms
- OTP cleanup job runs every 5 minutes

## Token Payload Structure
```typescript
interface AccessTokenPayload {
  userId: string;
  role: 'patient';
  iat: number;
  exp: number;
}

interface RefreshTokenPayload {
  userId: string;
  tokenType: 'refresh';
  iat: number;
  exp: number;
}
```

## Post-Implementation Checklist
- [ ] Tests pass with >90% code coverage
- [ ] Performance meets <200ms requirement
- [ ] Tokens are properly signed and validated
- [ ] OTPs are single-use and expire correctly
- [ ] Integration with Supabase complete
- [ ] Rate limiting works correctly
- [ ] Error messages are user-friendly but secure
- [ ] OTP cleanup job functions properly
- [ ] User creation and update logic works
- [ ] All edge cases handled in tests
]>