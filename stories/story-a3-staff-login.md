<[
\---
title: "Story A3: Staff Email/Password Login with Hospital Admin Integration"
epic: "Epic A: Authentication & User Management"
priority: "High"
status: "Completed"
as_a: "A staff member (Admin/Doctor/Pharmacist)"
so_i_can: "Log in with my email and password"
in_order_to: "Access the web dashboard with appropriate hospital permissions"
---

## Story
As a hospital staff member (Hospital Admin, Doctor, or Pharmacist), I want to log in with credentials created by my hospital admin so that I can access the web dashboard with appropriate permissions for my role and hospital.

## Acceptance Criteria
1. **Credential Validation**
   - Validates email exists in system (pre-created by admin)
   - Verifies against auto-generated temporary password or user-changed password
   - Returns 401 for non-existent emails
   - Returns 401 for invalid credentials
   - Never reveals which field was incorrect

2. **First Login Flow**
   - Detects if using temporary password
   - Forces immediate password change on first login
   - Returns first_login flag in response
   - Temporary passwords are single-use only

3. **Role-Based Access Control**
   - Verifies user role (HOSPITAL_ADMIN, DOCTOR, PHARMACIST)
   - Confirms user is associated with valid hospital
   - Returns appropriate permissions based on role

4. **JWT Token Issuance**
   - Access token: 2-hour expiration
   - Refresh token: 12-hour expiration
   - Tokens include role, hospital_id, and permissions
   - Tokens include first-login flag if password change required

5. **Response Variants**
   ```json
   // Standard login response
   {
     "success": true,
     "data": {
       "user": {
         "user_id": "uuid",
         "email": "dr.smith@apollo.curekahealth.com",
         "full_name": "Dr. Smith",
         "role": "DOCTOR",
         "hospital_id": "uuid",
         "hospital_name": "Apollo Hospitals",
         "permissions": ["read_patients", "write_prescriptions"]
       },
       "access_token": "eyJhbGc...2h",
       "refresh_token": "eyJhbGc...7d",
       "token_type": "Bearer",
       "expires_in": 7200,
       "first_login": false
     }
   }

   // First login response (password change required)
   {
     "success": true,
     "data": {
       "user": {
         "user_id": "uuid",
         "email": "admin@apollo.curekahealth.in",
         "role": "HOSPITAL_ADMIN",
       },
       "access_token": "eyJhbGc...2h",
       "refresh_token": "eyJhbGc...7d",
       "token_type": "Bearer",
       "expires_in": 7200,
       "first_login": true,
       "requires_password_change": true
     }
   }
   ```

## Technical Context

### Key Dependencies
```bash
npm install bcrypt express-validator jsonwebtoken helmet-rate-limit express-brute @hapi/joi
```

### Key Files Structure
```
apps/api/src/
├── services/
│   ├── staff-auth.service.ts
│   ├── password.service.ts
│   └── token.service.ts
├── api/v1/auth/staff/
│   ├── staff.controller.ts
│   ├── staff.service.ts
│   ├── staff.validation.ts
│   └── staff.interface.ts
└── middleware/
    └── first-login.middleware.ts
```

### Database Schema Requirements
```sql
-- Users table should have these fields (existing schema)
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role user_role NOT NULL, -- From existing ENUM
  hospital_id UUID REFERENCES hospitals(id),
  password_temp BOOLEAN DEFAULT false,
  force_password_change BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  lockout_until TIMESTAMP;
```

### Request Validation Schema
```typescript
// apps/api/src/api/v1/auth/staff/staff.validation.ts
export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

// Hospital-specific email validation
export const validateHospitalEmail = async (email: string): Promise<{isValid: boolean, hospitalName?: string, role?: string}> => {
  const emailParts = email.split('@');
  if (emailParts.length !== 2) return { isValid: false };

  const [username, domain] = emailParts;
  const domainParts = domain.split('.');

  // Hospital Admin: [anything]@[hospital].curekahealth.in
  if (domain.endsWith('.curekahealth.in') && domainParts.length === 3) {
    const hospitalName = domainParts[0];
    return { isValid: true, hospitalName, role: 'HOSPITAL_ADMIN' };
  }

  // Doctor: [name]@[hospital].curekahealth.com
  if (domain.endsWith('.curekahealth.com') && domainParts.length === 3) {
    const hospitalName = domainParts[0];
    return { isValid: true, hospitalName, role: 'DOCTOR' };
  }

  // Pharmacist: [name]@[hospital].curekahealth.pharm
  if (domain.endsWith('.curekahealth.pharm') && domainParts.length === 3) {
    const hospitalName = domainParts[0];
    return { isValid: true, hospitalName, role: 'PHARMACIST' };
  }

  return { isValid: false };
};
```

### Environment Variables
```bash
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=super-secure-access-secret
JWT_REFRESH_SECRET=super-secure-refresh-secret
JWT_ACCESS_EXPIRE=2h
JWT_REFRESH_EXPIRE=12h
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MS=900000  # 15 minutes
PASSWORD_CHANGE_REQUIRED_STATUS=499  # Custom status for first login
```

## Implementation Details

### Step 1: Enhanced Authentication Flow
```typescript
// apps/api/src/services/staff-auth.service.ts
export class StaffAuthService {
  async authenticate(email: string, password: string): Promise<AuthResult> {
    // 1. Validate email format and hospital domain
    const emailValidation = await validateHospitalEmail(email);
    if (!emailValidation.isValid) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // 2. Get user by email with hospital info
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        hospital: true,
        doctor: true,
        pharmacist: true,
        hospitalAdmin: true
      }
    });

    if (!user || user.role === 'PATIENT') {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // 3. Account lockout check
    if (user.lockout_until && user.lockout_until > new Date()) {
      throw new AuthError('ACCOUNT_LOCKED', 'Too many failed login attempts. Please wait.');
    }

    // 4. Verify password
    const isValidPassword = await PasswordService.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      await this.incrementLoginAttempts(user.id);
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // 5. Check for temporary password (first login)
    const isFirstLogin = user.password_temp || user.force_password_change;

    // 6. Reset failed attempts and update last login
    await this.resetLoginAttempts(user.id);
    await this.updateLastLogin(user.id);

    return {
      user,
      isFirstLogin
    };
  }

  async getUserWithHospitalInfo(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        hospital: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }
}
```

### Step 2: Enhanced Token Service
```typescript
// apps/api/src/services/token.service.ts
export class TokenService {
  static generateTokens(user: User, isFirstLogin: boolean = false) {
    const permissions = this.getPermissionsByRole(user.role);

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      hospitalId: user.hospital_id,
      permissions: permissions,
      isFirstLogin: isFirstLogin
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: process.env.JWT_ACCESS_EXPIRE }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 7200, // 2 hours in seconds
      permissions,
      isFirstLogin
    };
  }

  private static getPermissionsByRole(role: string): string[] {
    const permissions: Record<string, string[]> = {
      'HOSPITAL_ADMIN': [
        'manage_hospital_staff',
        'create_doctors',
        'create_pharmacists',
        'view_hospital_metrics',
        'manage_hospital_settings'
      ],
      'DOCTOR': [
        'read_patients',
        'write_prescriptions',
        'manage_schedule',
        'view_patient_history',
        'conduct_consultations'
      ],
      'PHARMACIST': [
        'read_prescriptions',
        'manage_prescription_status',
        'dispense_medications',
        'inventory_management'
      ]
    };
    return permissions[role] || [];
  }
}
```

### Step 3: Login Controller with First Login Handling
```typescript
// apps/api/src/api/v1/auth/staff/staff.controller.ts
export class StaffAuthController {
  static async login(req: Request, res: Response) {
    try {
      // Validate request
      await validateRequest(req, loginValidation);

      const { email, password } = req.body;

      // Authenticate user
      const authResult = await StaffAuthService.authenticate(email, password);

      // Generate tokens
      const tokenResult = TokenService.generateTokens(authResult.user, authResult.isFirstLogin);

      // Prepare response based on login status
      if (authResult.isFirstLogin) {
        // For first login, return minimal info and require password change
        return res.status(200).json({
          success: true,
          data: {
            user: {
              user_id: authResult.user.id,
              email: authResult.user.email,
              role: authResult.user.role,
            },
            access_token: tokenResult.accessToken,
            refresh_token: tokenResult.refreshToken,
            token_type: 'Bearer',
            expires_in: tokenResult.expiresIn,
            first_login: true,
            requires_password_change: true
          }
        });
      } else {
        // Standard login with full user info
        const hospitalInfo = await prisma.hospital.findUnique({
          where: { id: authResult.user.hospital_id! }
        });

        return res.status(200).json({
          success: true,
          data: {
            user: {
              user_id: authResult.user.id,
              email: authResult.user.email,
              full_name: authResult.user.profile?.full_name,
              role: authResult.user.role,
              hospital_id: authResult.user.hospital_id,
              hospital_name: hospitalInfo?.name,
              permissions: tokenResult.permissions
            },
            access_token: tokenResult.accessToken,
            refresh_token: tokenResult.refreshToken,
            token_type: 'Bearer',
            expires_in: tokenResult.expiresIn,
            first_login: false
          }
        });
      }

    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.status).json({
          success: false,
          code: error.code,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed'
      });
    }
  }
}
```

### Step 4: First Login Middleware
```typescript
// apps/api/src/middleware/first-login.middleware.ts
export class FirstLoginMiddleware {
  static requirePasswordChange(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Check if token indicates first login
    if (req.user.isFirstLogin) {
      return res.status(parseInt(process.env.PASSWORD_CHANGE_REQUIRED_STATUS || '499')).json({
        success: false,
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'Please change your temporary password',
        redirect: '/auth/first-login'
      });
    }

    next();
  }
}
```

## Testing Requirements

### Unit Tests Structure
```
apps/api/tests/auth/
├── staff-login.test.ts
├── staff-auth.integration.test.ts
├── first-login.test.ts
└── hospital-email-validation.test.ts
```

### Key Test Cases
```typescript
describe('Staff Login with Hospital Integration', () => {
  describe('Hospital Admin Login', () => {
    it('should authenticate hospital admin and detect first login', async () => {
      const response = await request(app)
        .post('/api/v1/auth/staff/login')
        .send({
          email: 'admin@apollo.curekahealth.in',
          password: 'TempPassword123!'
        })
        .expect(200);

      expect(response.body.data.first_login).toBe(true);
      expect(response.body.data.requires_password_change).toBe(true);
      expect(response.body.data.user.role).toBe('HOSPITAL_ADMIN');
    });

    it('should authenticate hospital admin with changed password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/staff/login')
        .send({
          email: 'admin@apollo.curekahealth.in',
          password: 'NewSecurePassword456@'
        })
        .expect(200);

      expect(response.body.data.first_login).toBe(false);
      expect(response.body.data.user.hospital_name).toBe('Apollo Hospitals');
      expect(response.body.data.permissions).toContain('manage_hospital_staff');
    });
  });

  describe('Doctor Login', () => {
    it('should authenticate doctor with hospital association', async () => {
      const response = await request(app)
        .post('/api/v1/auth/staff/login')
        .send({
          email: 'dr.smith@apollo.curekahealth.com',
          password: 'DoctorPass789#'
        })
        .expect(200);

      expect(response.body.data.user.role).toBe('DOCTOR');
      expect(response.body.data.user.hospital_name).toBe('Apollo Hospitals');
      expect(response.body.data.permissions).toContain('write_prescriptions');
    });
  });

  describe('Email Validation', () => {
    it('should reject non-hospital emails', async () => {
      const response = await request(app)
        .post('/api/v1/auth/staff/login')
        .send({
          email: 'user@gmail.com',
          password: 'anyPassword'
        })
        .expect(401);

      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject malformed emails', async () => {
      const response = await request(app)
        .post('/api/v1/auth/staff/login')
        .send({
          email: 'not-an-email',
          password: 'anyPassword'
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

## Error Handling

```typescript
const STAFF_AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: { code: 'INVALID_CREDENTIALS', status: 401 },
  ACCOUNT_LOCKED: { code: 'ACCOUNT_LOCKED', status: 423 },
  INVALID_ROLE: { code: 'INVALID_ROLE', status: 403 },
  DOMAIN_NOT_ALLOWED: { code: 'DOMAIN_NOT_ALLOWED', status: 400 },
  MISSING_REQUIRED_FIELDS: { code: 'MISSING_REQUIRED_FIELDS', status: 400 },
  PASSWORD_CHANGE_REQUIRED: { code: 'PASSWORD_CHANGE_REQUIRED', status: 499 }
};

export class AuthError extends Error {
  public code: string;
  public status: number;

  constructor(errorCode: keyof typeof STAFF_AUTH_ERROR_CODES, message?: string) {
    const error = STAFF_AUTH_ERROR_CODES[errorCode];
    super(message || 'Authentication failed');
    this.code = error.code;
    this.status = error.status;
  }
}
```

## Security Considerations

1. **Hospital-Based Email Validation**: Strict domain validation ensures only authorized hospital staff
2. **First Login Enforcement**: Temporary passwords must be changed before accessing system
3. **Brute Force Protection**: Account lockout after 5 failed attempts for 15 minutes
4. **Password Security**: bcrypt hashing with minimum 12 salt rounds
5. **Token Security**: JWT tokens with appropriate expiration times
6. **Audit Logging**: All login attempts logged for security monitoring
7. **HTTPS Only**: All authentication operations require HTTPS

## Performance Optimization

1. **Database Indexing**: Proper indexes on email and hospital_id fields
2. **Connection Pooling**: Efficient database connection management
3. **Token Caching**: Consider caching frequently used tokens
4. **Rate Limiting**: API-level rate limiting to prevent abuse

## Post-Implementation Checklist

- [ ] Hospital-based email domain validation working
- [ ] First login password change enforcement
- [ ] Temporary password handling
- [ ] Role-based permissions with hospital context
- [ ] Integration with Hospital Admin credential management
- [ ] Unit tests covering all authentication flows
- [ ] Integration tests with Supabase database
- [ ] Brute force protection active
- [ ] Audit logging for all login events
- [ ] Performance meets 200ms requirement at 95th percentile
- [ ] Security review completed
- [ ] All error scenarios handled appropriately
- [ ] Documentation updated with hospital integration details
]>