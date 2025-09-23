<[
\---
title: "Story C0: Hospital Admin Management and Credential Distribution"
epic: "Epic C: Staff & Hospital Management"
priority: "High"
status: "Completed"
as_a: "System Developer"
so_i_can: "Set up hospital administrators with temporary credentials"
in_order_to: "Enable hospitals to manage their own doctors and pharmacists"

---

## Story
As a system developer, I want to set up hospital administrators with temporary login credentials so that hospitals can manage their own doctors and pharmacists credential distribution.

## Acceptance Criteria
1. **Hospital Creation**
   - System can create new hospital records with name and address
   - Each hospital gets a unique hospital_id
   - Hospital is created in active status

2. **Admin User Creation**
   - System creates hospital admin user with:
     - Temporary email: admin@[hospital-name].curekahealth.in
     - Temporary password: Auto-generated secure password
     - Role: HOSPITAL_ADMIN
     - Hospital_id: Linked to created hospital
   - Email and password are securely stored

3. **Credential Distribution**
   - Admin credentials are logged for developer distribution
   - Credentials are marked as temporary requiring change on first login
   - System tracks credential status (temporary/active)

4. **Admin Permissions**
   - Hospital admins can create doctor accounts with:
     - Email: [doctor-name]@[hospital-name].curekahealth.com
     - Temporary password
     - Role: DOCTOR
     - Hospital_id: Auto-linked to admin's hospital
   - Hospital admins can create pharmacist accounts with:
     - Email: [pharmacist-name]@[hospital-name].curekahealth.pharm
     - Temporary password
     - Role: PHARMACIST
     - Hospital_id: Auto-linked to admin's hospital
   - Hospital admins can manage their hospital's staff (CRUD operations)

5. **Security Requirements**
   - Temporary passwords must be changed on first login
   - Password complexity requirements for all staff
   - Audit logging for all credential creation/modification

## Technical Context

### Database Schema Updates
Based on existing schema, we need to ensure the following tables support our requirements:

```sql
-- Hospitals table (already exists)
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users table extensions (already exists with needed fields)
ALTER TABLE users ADD COLUMN IF NOT EXISTS
    password_temp BOOLEAN DEFAULT true,
    force_password_change BOOLEAN DEFAULT true;

-- Hospital Admins table (already exists)
CREATE TABLE hospital_admins (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT
);
```

### Key Files to Create/Modify
```
apps/api/src/
├── services/
│   ├── hospital-setup.service.ts
│   ├── credential-management.service.ts
│   └── temporary-password.service.ts
├── api/v1/hospitals/
│   ├── hospital-admin.controller.ts
│   ├── hospital-admin.service.ts
│   ├── hospital-admin.validation.ts
│   └── hospital-admin.interface.ts
├── api/v1/auth/
│   └── first-login/
│       ├── first-login.controller.ts
│       ├── first-login.service.ts
│       └── first-login.validation.ts
└── utils/
    └── password-generator.ts
```

### Environment Variables
```bash
# Password policies
TEMP_PASSWORD_LENGTH=12
TEMP_PASSWORD_INCLUDE_SYMBOLS=true
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=true

# Email domain patterns
ADMIN_DOMAIN_PATTERN=curekahealth.in
DOCTOR_DOMAIN_PATTERN=curekahealth.com
PHARMACIST_DOMAIN_PATTERN=curekahealth.pharm

# System notifications
HOSPITAL_SETUP_NOTIFICATION_EMAIL=admin-notifications@cureka.health
```

## Implementation Steps

### Step 1: Hospital and Admin Creation Service
```typescript
// apps/api/src/services/hospital-setup.service.ts
export class HospitalSetupService {
  static async createHospitalWithAdmin(hospitalData: HospitalData): Promise<HospitalSetupResult> {
    // 1. Create hospital record
    const hospital = await prisma.hospital.create({
      data: {
        name: hospitalData.name,
        address: hospitalData.address
      }
    });

    // 2. Generate admin credentials
    const adminEmail = this.generateAdminEmail(hospitalData.name);
    const tempPassword = await TemporaryPasswordService.generateSecurePassword();

    // 3. Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password_hash: await PasswordService.hashPassword(tempPassword),
        role: 'HOSPITAL_ADMIN',
        password_temp: true,
        force_password_change: true,
        hospitalAdmin: {
          create: {
            hospitalId: hospital.id
          }
        }
      }
    });

    // 4. Log credentials for distribution
    await this.logCredentialsForDistribution({
      hospitalId: hospital.id,
      adminUserId: adminUser.id,
      email: adminEmail,
      password: tempPassword,
      createdAt: new Date()
    });

    // 5. Send setup notification
    await NotificationService.sendHospitalSetupNotification({
      hospitalName: hospitalData.name,
      adminEmail: adminEmail
    });

    return {
      hospital,
      adminUser,
      credentials: {
        email: adminEmail,
        password: tempPassword
      }
    };
  }

  private static generateAdminEmail(hospitalName: string): string {
    // Convert hospital name to domain-safe format
    const cleanName = hospitalName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20); // Limit length

    return `admin@${cleanName}.${process.env.ADMIN_DOMAIN_PATTERN}`;
  }
}
```

### Step 2: Credential Management for Hospital Admins
```typescript
// apps/api/src/api/v1/hospitals/hospital-admin.service.ts
export class HospitalAdminService {
  static async createDoctor(adminId: string, doctorData: StaffData): Promise<StaffCreationResult> {
    // 1. Verify admin permissions
    const admin = await prisma.hospitalAdmin.findUnique({
      where: { userId: adminId },
      include: { user: true, hospital: true }
    });

    if (!admin) {
      throw new AuthorizationError('Invalid admin credentials');
    }

    // 2. Generate doctor credentials
    const doctorEmail = this.generateDoctorEmail(doctorData.name, admin.hospital.name);
    const tempPassword = await TemporaryPasswordService.generateSecurePassword();

    // 3. Create doctor user
    const doctorUser = await prisma.user.create({
      data: {
        email: doctorEmail,
        password_hash: await PasswordService.hashPassword(tempPassword),
        role: 'DOCTOR',
        hospital_id: admin.hospitalId,
        password_temp: true,
        force_password_change: true,
        doctor: {
          create: {
            hospitalId: admin.hospitalId,
            specialty: doctorData.specialty
          }
        }
      }
    });

    // 4. Send notification to admin
    await NotificationService.sendStaffCredentialNotification({
      adminEmail: admin.user.email,
      staffName: doctorData.name,
      staffEmail: doctorEmail,
      staffRole: 'Doctor',
      tempPassword: tempPassword
    });

    return {
      user: doctorUser,
      credentials: {
        email: doctorEmail,
        password: tempPassword
      }
    };
  }

  static async createPharmacist(adminId: string, pharmacistData: StaffData): Promise<StaffCreationResult> {
    // Similar implementation to createDoctor but for pharmacists
    // ... implementation details
  }

  private static generateDoctorEmail(doctorName: string, hospitalName: string): string {
    const cleanDoctorName = doctorName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);

    const cleanHospitalName = hospitalName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);

    return `${cleanDoctorName}@${cleanHospitalName}.${process.env.DOCTOR_DOMAIN_PATTERN}`;
  }
}
```

### Step 3: First Login Password Change
```typescript
// apps/api/src/api/v1/auth/first-login/first-login.service.ts
export class FirstLoginService {
  static async changeTemporaryPassword(userId: string, newPassword: string, currentPassword: string): Promise<boolean> {
    // 1. Verify current password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'User not found');
    }

    const isValid = await PasswordService.verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid current password');
    }

    // 2. Validate new password strength
    if (!PasswordService.validatePasswordStrength(newPassword)) {
      throw new ValidationError('PASSWORD_TOO_WEAK', 'Password does not meet security requirements');
    }

    // 3. Update password and mark as non-temporary
    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: await PasswordService.hashPassword(newPassword),
        password_temp: false,
        force_password_change: false,
        updated_at: new Date()
      }
    });

    // 4. Log password change
    await AuditService.logPasswordChange(userId);

    return true;
  }
}
```

### Step 4: Temporary Password Generator
```typescript
// apps/api/src/utils/password-generator.ts
export class TemporaryPasswordService {
  static async generateSecurePassword(length: number = 12): Promise<string> {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    let charset = lowercase + uppercase + numbers;
    if (process.env.TEMP_PASSWORD_INCLUDE_SYMBOLS === 'true') {
      charset += symbols;
    }

    let password = '';
    // Ensure at least one character from each required set
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    if (process.env.TEMP_PASSWORD_INCLUDE_SYMBOLS === 'true') {
      password += symbols[Math.floor(Math.random() * symbols.length)];
    }

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}
```

## Testing Requirements

### Unit Tests Structure
```
apps/api/tests/hospitals/
├── hospital-setup.test.ts
├── credential-management.test.ts
├── first-login.test.ts
└── password-generator.test.ts
```

### Key Test Cases
```typescript
describe('Hospital Admin Management', () => {
  describe('Hospital Creation', () => {
    it('should create hospital with admin credentials', async () => {
      const hospitalData = {
        name: 'Apollo Hospitals',
        address: '123 Medical Avenue, Chennai'
      };

      const result = await HospitalSetupService.createHospitalWithAdmin(hospitalData);

      expect(result.hospital.name).toBe(hospitalData.name);
      expect(result.adminUser.email).toMatch(/admin@apollohospitals\.curekahealth\.in/);
      expect(result.adminUser.role).toBe('HOSPITAL_ADMIN');
      expect(result.credentials.password).toHaveLength(12);
    });
  });

  describe('Staff Credential Creation', () => {
    it('should allow hospital admin to create doctor credentials', async () => {
      const adminId = 'admin-uuid';
      const doctorData = {
        name: 'Dr. Smith',
        specialty: 'Cardiology'
      };

      const result = await HospitalAdminService.createDoctor(adminId, doctorData);

      expect(result.user.role).toBe('DOCTOR');
      expect(result.credentials.email).toMatch(/drsmith@.*\.curekahealth\.com/);
      expect(result.credentials.password).toHaveLength(12);
    });
  });

  describe('First Login Password Change', () => {
    it('should force password change for temporary credentials', async () => {
      const userId = 'user-uuid';
      const currentPassword = 'tempPassword123!';
      const newPassword = 'NewSecurePass456@';

      // This should succeed
      const result = await FirstLoginService.changeTemporaryPassword(userId, newPassword, currentPassword);
      expect(result).toBe(true);

      // Verify user is no longer marked as temporary
      const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
      expect(updatedUser?.password_temp).toBe(false);
      expect(updatedUser?.force_password_change).toBe(false);
    });
  });
});
```

## Security Considerations

### Credential Management Security
1. **Temporary Passwords**: Auto-generated passwords are immediately logged for secure distribution
2. **Mandatory Change**: All temporary passwords must be changed on first login
3. **Password Complexity**: Enforced both at generation and change time
4. **Audit Trail**: All credential operations are logged
5. **Secure Distribution**: Credentials are distributed through secure channels

### Access Control
1. **Role-Based Permissions**: Hospital admins can only manage their own hospital's staff
2. **Domain Validation**: Staff emails follow hospital-specific domain patterns
3. **Rate Limiting**: Credential creation is rate-limited to prevent abuse
4. **Session Management**: Proper JWT token handling with appropriate expiration

### Data Protection
1. **Password Hashing**: bcrypt with 12+ rounds for all passwords
2. **Encryption at Rest**: Sensitive data encrypted in database
3. **HTTPS Enforcement**: All credential operations over secure connections
4. **Temporary Credential Cleanup**: Automatic cleanup of unused temporary credentials

## Performance Optimization

1. **Database Indexing**: Proper indexes on hospital_id and user relationships
2. **Connection Pooling**: Efficient database connection management
3. **Caching**: Cache frequently accessed hospital data
4. **Batch Operations**: Support for bulk staff creation when needed

## Integration Points

1. **Email Service**: Integration with email provider for credential distribution
2. **Notification System**: Real-time notifications for credential operations
3. **Audit Logging**: Comprehensive audit trail for compliance
4. **Monitoring**: Performance and security monitoring of credential operations

## Post-Implementation Checklist

- [ ] Hospital creation with admin setup working
- [ ] Temporary credential generation and distribution
- [ ] First login password change enforcement
- [ ] Doctor and pharmacist credential creation by admins
- [ ] Domain-based email validation for all roles
- [ ] Password complexity requirements implemented
- [ ] Audit logging for all credential operations
- [ ] Secure credential distribution mechanism
- [ ] Rate limiting for credential operations
- [ ] Integration with existing authentication system
- [ ] All tests passing with >90% coverage
- [ ] Security review completed
- [ ] Performance benchmarks met
]>