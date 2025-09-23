# Hierarchical Authentication System

## Overview
This document describes the complete hierarchical authentication system implemented for the Cureka healthcare platform, following the specified approach where super admins create hospitals, hospital admins create staff, and staff login with auto-generated temporary credentials.

## Authentication Hierarchy

### Level 1: Super Admin (Us)
- **Role**: System administrators
- **Permissions**: Create hospitals and their admin accounts
- **Method**: CLI script execution
- **Command**: `pnpm create-hospital <hospital_name> <admin_email> <admin_full_name>`

### Level 2: Hospital Admins
- **Role**: Hospital administrators
- **Permissions**: Create doctors and pharmacists for their hospital
- **Method**: API endpoint with proper authentication
- **Endpoint**: `POST /api/v1/doctors` (and similar for pharmacists)

### Level 3: Hospital Staff (Doctors/Pharmacists)
- **Role**: Hospital staff members
- **Permissions**: Access to their respective dashboards
- **Method**: Standard login with credentials created for them
- **Endpoint**: `POST /api/v1/auth/staff/login`

## Workflow Implementation

### 1. Hospital Creation by Super Admin
```bash
# Super admin runs this command
pnpm create-hospital "Apollo Hospitals" "admin@apollo.curekahealth.in" "John Admin"

# System creates:
# - Hospital record in database
# - Hospital admin user with temporary password
# - Auto-generated 16-character secure temporary password
# - Sets force_password_change = true
```

### 2. Staff Creation by Hospital Admin
```http
POST /api/v1/doctors
Authorization: Bearer {hospital-admin-jwt}
{
  "email": "dr.smith@apollo.curekahealth.com",
  "full_name": "Dr. Smith",
  "specialty": "Cardiology",
  "hospital_id": "hospital-uuid"
}

Response:
{
  "success": true,
  "data": {
    "user_id": "doctor-uuid",
    "email": "dr.smith@apollo.curekahealth.com",
    "full_name": "Dr. Smith",
    "specialty": "Cardiology",
    "hospital_id": "hospital-uuid",
    "requires_first_login": true
  },
  "message": "Doctor profile created successfully. Temporary credentials generated."
}
```

### 3. Staff First Login
```http
POST /api/v1/auth/staff/login
{
  "email": "dr.smith@apollo.curekahealth.com",
  "password": "{temporary-password}"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "user_id": "doctor-uuid",
      "email": "dr.smith@apollo.curekahealth.com",
      "full_name": "Dr. Smith",
      "role": "DOCTOR",
      "hospital_id": "hospital-uuid",
      "permissions": ["read_patients", "write_prescriptions"]
    },
    "access_token": "eyJ...",
    "refresh_token": "refresh-eyJ...",
    "token_type": "Bearer",
    "expires_in": 7200,
    "first_login": true,
    "requires_password_change": true
  }
}
```

### 4. Password Change on First Login
The system automatically forces password change on first login for temporary credentials.

## Security Features

### Credential Distribution
- **Super Admin**: Creates initial hospital admin accounts
- **Temporary Passwords**: Auto-generated, 12-16 characters with high entropy
- **Single-Use**: Temporary passwords are deleted after first use
- **Forced Change**: System requires password change on first login

### Domain Validation
- **Hospital Admins**: `admin@{hospital}.curekahealth.in`
- **Doctors**: `{name}@{hospital}.curekahealth.com`
- **Pharmacists**: `{name}@{hospital}.curekahealth.pharm`

### Permission Enforcement
- **Hospital Admins**: Can only create staff for their own hospital
- **Staff**: Limited to their role-specific permissions
- **Super Admin**: System-level operations only

## Database Schema

### Key Fields Added
```prisma
model User {
  passwordHash        String? // For staff login
  hospitalId          String? // Hospital association
  passwordTemp        Boolean? @default(false) // Temporary password flag
  forcePasswordChange Boolean? @default(false) // Force change on login
  lastLogin           DateTime?
  loginAttempts       Int? @default(0)
  lockoutUntil        DateTime?
}
```

## API Endpoints

### Super Admin Operations
```bash
# CLI script for hospital creation
pnpm create-hospital <hospital_name> <admin_email> <admin_full_name>
```

### Hospital Admin Operations
```http
POST /api/v1/doctors
POST /api/v1/pharmacists
GET /api/v1/hospitals/{id}
```

### Staff Operations
```http
POST /api/v1/auth/staff/login
POST /api/v1/auth/staff/refresh
```

## Error Handling

### Common Error Codes
- `INSUFFICIENT_PERMISSIONS` (403) - Wrong user level
- `HOSPITAL_MISMATCH` (403) - Admin trying to create staff for wrong hospital
- `EMAIL_DOMAIN_MISMATCH` (400) - Email domain doesn't match hospital
- `EMAIL_EXISTS` (409) - User already registered
- `HOSPITAL_NOT_FOUND` (404) - Invalid hospital ID

## Testing

### Test Scripts
- `test-hospital-create.js` - Hospital creation validation
- `test-doctor-create-corrected.js` - Doctor creation with proper hierarchy
- `test-staff-login.js` - Staff login with temporary credentials
- `test-patient-otp-request.js` - Patient authentication (unchanged)
- `test-patient-otp-verify.js` - Patient authentication (unchanged)

## Implementation Files

### Core Authentication
- `apps/api/src/services/password.service.ts` - Password hashing
- `apps/api/src/services/staff-auth.service.ts` - Staff authentication logic
- `apps/api/src/api/v1/auth/staff/` - Staff authentication endpoints

### Hospital Management
- `apps/api/src/api/v1/hospitals/` - Hospital creation endpoints
- `apps/api/scripts/create-hospital.ts` - Super admin CLI tool

### Staff Management
- `apps/api/src/api/v1/doctors/` - Doctor creation endpoints
- `apps/api/src/api/v1/pharmacists/` - Pharmacist creation endpoints (to be implemented)