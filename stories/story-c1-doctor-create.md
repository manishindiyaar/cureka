<[
\---
title: "Story C1: Create Doctor Profile"
epic: "Epic C: Staff & Hospital Management"
priority: "Medium"
status: "Completed"
as_a: "A hospital admin"
so_i_can: "Create a new doctor profile with login credentials"
in_order_to: "Allow the doctor to access the system"
---

## Story
As a hospital admin, I want to create a new doctor profile with auto-generated temporary credentials so that the doctor can access the system after changing their password.

## Acceptance Criteria
1. **Input Validation**
   - Required fields: email, full_name, specialty, hospital_id
   - Email must be in format: [name]@{hospital}.curekahealth.com
   - Full name must be 2-50 characters
   - Specialty must be from approved list
   - Hospital ID must exist in database and match email domain

2. **Auto-Generated Credentials**
   - System auto-generates secure temporary password (12+ chars)
   - Temporary password is single-use only
   - User must change password on first login
   - Password is never returned in API responses after creation

3. **Email Uniqueness Check**
   - Verifies email is not already registered
   - Returns 409 CONFLICT if email exists
   - Case-insensitive email matching

4. **Role Assignment**
   - Automatically assigns role = 'DOCTOR'
   - Links to provided hospital_id
   - Sets permissions array: ['read_patients', 'write_prescriptions', 'manage_schedule', 'view_insights']

5. **Success Response**
   ```json
   {
     "success": true,
     "data": {
       "user_id": "123e4567-e89b-12d3-a456-426614174000",
       "email": "dr.smith@apollo.curekahealth.com",
       "full_name": "Dr. Smith",
       "specialty": "Cardiology",
       "hospital_id": "hosp123-abc-456",
       "created_at": "2025-09-21T10:30:00Z",
       "role": "DOCTOR",
       "permissions": ["read_patients", "write_prescriptions", "manage_schedule"],
       "requires_first_login": true
     },
     "message": "Doctor profile created successfully. Temporary credentials sent to email."
   }
   ```

## Technical Context

### Doctor Specializations List
```typescript
const APPROVED_SPECIALTIES = [
  'General Medicine',
  'Cardiology',
  'Internal Medicine',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Dermatology',
  'Orthopedics',
  'Ophthalmology',
  'ENT',
  'Surgery',
  'Neurology',
  'Psychiatry',
  'Radiology',
  'Anesthesiology'
];
```

### Key Files Structure
```
apps/api/src/
├── api/v1/doctors/
│   ├── doctors.controller.ts
│   ├── doctors.service.ts
│   ├── doctors.validation.ts
│   └── doctors.dto.ts
├── services/
│   ├── user.service.ts
│   ├── password.service.ts
│   └── email.service.ts
└── middleware/
    ├── auth.middleware.ts
    └── permissions.middleware.ts
```

### Database Schema Addition
```sql
-- Create doctors specific table if needed (in addition to users)
CREATE TABLE doctors (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  specialty VARCHAR(100) NOT NULL,
  license_number VARCHAR(50),
  years_experience INTEGER,
  education JSONB,
  availability JSONB DEFAULT '{}',
  consultation_fee DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doctors_specialty ON doctors(specialty);
CREATE INDEX idx_doctors_hospital ON doctors(hospital_id WHERE hospital_id IS NOT NULL);
```

### Request Body Validation
```typescript
// apps/api/src/api/v1/doctors/doctors.validation.ts
export const createDoctorValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isEmail({ domain_specific_validation: true })
    .matches(/^[^@\s]+@curekahealth\.com$/)
    .withMessage('Email must use curekahealth.com domain'),
  body('password')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })
    .withMessage('Password must be strong'),
  body('full_name')
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s\-.]+$/)
    .withMessage('Full name should only contain letters and spaces'),
  body('specialty')
    .isIn(APPROVED_SPECIALTIES)
    .withMessage('Specialty must be from approved list'),
  body('hospital_id')
    .isUUID(4)
    .withMessage('Hospital ID must be valid UUID')
];
```

### Environment Variables
```bash
# Email Settings
STAFF_EMAIL_DOMAIN=curekahealth.com
DOCTOR_EMAIL_TEMPLATE=onboarding-doctor
WELCOME_EMAIL_SUBJECT="Welcome to Cureka Health"

# Security Settings
BCRYPT_SALT_ROUNDS=12
MAX_DOCTORS_PER_HOSPITAL=100
DEFAULT_CONSULTATION_FEE=500
```

## Implementation Steps

### Step 1: Create Controller
```typescript
// apps/api/src/api/v1/doctors/doctors.controller.ts
export class DoctorController {
  async createDoctor(req: AuthenticatedRequest, res: Response) {
    try {
      // 1. Validate request body
      await validateRequest(req, createDoctorValidation);

      // 2. Check permissions (must be ADMIN)
      if (req.user.role !== 'ADMIN') {
        throw new PermissionError('INSUFFICIENT_PERMISSIONS');
      }

      // 3. Check hospital_id belongs to admin
      if (req.user.hospital_id !== req.body.hospital_id) {
        throw new PermissionError('HOSPITAL_MISMATCH');
      }

      // 4. Create doctor
      const doctor = await this.doctorService.createDoctor(req.body);

      // 5. Send welcome email (async)
      await emailService.sendDoctorWelcomeEmail(doctor);

      return res.status(201).json({
        success: true,
        data: doctor,
        message: 'Doctor profile created successfully'
      });

    } catch (error) {
      logger.error('Doctor creation failed', error);
      return errorHandler(error, res);
    }
  }
}
```

### Step 2: Doctor Service
```typescript
// apps/api/src/api/v1/doctors/doctors.service.ts
export class DoctorService {
  async createDoctor(doctorData: CreateDoctorDto): Promise<Doctor> {
    // 1. Check email uniqueness
    const existingUser = await userService.findByEmail(doctorData.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // 2. Hash password
    const hashedPassword = await PasswordService.hash(doctorData.password);

    // 3. Create user in database (transaction)
    const result = await supabase.transaction(async (trx) => {
      // Create users record
      const user = await trx.from('users')
        .insert({
          email: doctorData.email,
          password_hash: hashedPassword,
          full_name: doctorData.full_name,
          role: 'DOCTOR',
          hospital_id: doctorData.hospital_id,
          permissions: this.getDoctorPermissions(),
          created_at: new Date()
        })
        .select()
        .single();

      // Create doctors record
      await trx.from('doctors')
        .insert({
          id: user.id,
          specialty: doctorData.specialty,
          created_at: new Date()
        });

      return user;
    });

    // 4. Return sanitized data
    return this.sanitizeDoctor(result.data);
  }

  private getDoctorPermissions(): string[] {
    return [
      'read_patients',
      'write_prescriptions',
      'manage_schedule',
      'view_insights',
      'create_appointments',
      'start_video_conference'
    ];
  }

  private sanitizeDoctor(doctor: any) {
    // Remove sensitive fields
    delete doctor.password_hash;
    delete doctor.deleted_at;
    return doctor;
  }
}
```

### Step 3: Permission Middleware
```typescript
// apps/api/src/middleware/permissions.middleware.ts
export const requireHospitalAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'Hospital admin role required'
    });
  }

  if (!req.user.hospital_id) {
    return res.status(403).json({
      success: false,
      code: 'HOSPITAL_REQUIRED',
      message: 'User must be associated with a hospital'
    });
  }

  next();
};
```

## Testing Requirements

### Test File
```bash
touch apps/api/tests/doctors/doctors-create.test.ts
```

### Unit Tests
```typescript
// apps/api/tests/doctors/doctors-create.test.ts
describe('POST /api/v1/doctors', () => {
  describe('Given valid doctor data', () => {
    it('should create a new doctor profile', async () => {
      const mockHospital = await createMockHospital();
      const doctorData = {
        email: 'dr.patel@curekahealth.com',
        password: 'SecurePass123!',
        full_name: 'Dr. Priya Patel',
        specialty: 'Cardiology',
        hospital_id: mockHospital.id
      };

      const response = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(doctorData)
        .expect(201);

      expect(response.body.data.user_id).toBeDefined();
      expect(response.body.data.email).toBe('dr.patel@curekahealth.com');
      expect(response.body.data.role).toBe('DOCTOR');
      expect(response.body.data.permissions).toContain('read_patients');
    });
  });

  describe('Given duplicate email', () => {
    it('should return 409 conflict', async () => {
      // ...test setup...
      const response = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(existingDoctor)
        .expect(409);

      expect(response.body.code).toBe('CONFLICT');
    });
  });

  describe('Given non-admin role', () => {
    it('should return 403 forbidden', async () => {
      const doctorToken = await createMockDoctorToken();

      const response = await request(app)
        .post('/api/v1/doctors')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(newDoctorData)
        .expect(403);

      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });
});
```

### Integration Tests
- Test Redis transaction rollback on failure
- Test password comparison
- Test email uniqueness across hospitals

## Error Handling
```typescript
const ERROR_CODES = {
  CONFLICT: { code: 'EMAIL_EXISTS', status: 409, message: 'Email already registered' },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400, message: 'Invalid input' },
  INSUFFICIENT_PERMISSIONS: { code: 'INSUFFICIENT_PERMISSIONS', status: 403, message: 'Insufficient permissions' },
  HOSPITAL_NOT_FOUND: { code: 'HOSPITAL_NOT_FOUND', status: 404, message: 'Hospital not found' },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', status: 500, message: 'Database operation failed' }
};
```

## Security Considerations
1. **Password Security**: Use bcrypt with 12 rounds minimum
2. **Email Validation**: Strict domain validation prevents unauthorized email creation
3. **Role Assignment**: Locked to DOCTOR role, no user input
4. **Transaction Safety**: Use database transactions for atomic operations
5. **Audit Logging**: Log all doctor creation events with admin_id

## Post-Implementation Checklist
- [ ] Integration tests pass with mocked Supabase
- [ ] Password hashing verified in database
- [ ] Email notifications working (optional enhancement)
- [ ] Role-based authorization tested
- [ ] Transaction rollback tested
- [] Performance under load (<200ms requirement)
- [ ] All edge cases handled by tests]>