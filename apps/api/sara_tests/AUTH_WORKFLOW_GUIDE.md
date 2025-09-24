# Hospital & Staff Authentication Workflow Guide

This guide explains the complete authentication flow for hospitals, doctors, and pharmacists in the Cureka system.

## 🏥 System Architecture Overview

### User Roles:
1. **Patient** - Uses phone + OTP to login
2. **Hospital Admin** - Uses email + temporary password, login endpoint
3. **Doctor** - Uses email + temporary password, login endpoint
4. **Pharmacist** - Login via email + temporary password, login endpoint

---

## 🔄 Complete User Workflow Story

### Story 1: Hospital Setup
**Who**: System Administrator creates hospital
**When**: When a new hospital joins Cureka

```bash
# System Admin creates hospital account
curl -X POST http://localhost:3000/api/v1/hospitals \
-H "Content-Type: application/json" \
-d '{
  "hospital_name": "Apollo General Hospital",
  "admin_email": "admin@apollo.curekahealth.in",
  "admin_full_name": "Dr. Apurva Mehta"
}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "hospital": {
      "id": "ap-hospital-123",
      "name": "Apollo General Hospital"
    },
    "admin": {
      "id": "ap-admin-456",
      "email": "admin@apollo.curekahealth.in",
      "role": "HOSPITAL_ADMIN"
    },
    "temporary_password": "T8mP@Pass123!"
  },
  "message": "Hospital and admin account created successfully. Temporary credentials generated."
}
```

**📝 Important:**
- Hospital name MUST match email domain (apollo in admin@apollo.curekahealth.in)
- This is a one-time setup by system admin
- Temporary password is sent to admin email (in production)

---

### Story 2: Hospital Admin Login
**Who**: Hospital Administrator
**When**: After successful hospital setup

```bash
# Hospital admin login with credentials
curl -X POST http://localhost:3000/api/v1/auth/staff/login \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@apollo.curekahealth.in",
  "password": "T8mP@Pass123!"
}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "ap-admin-456",
      "email": "admin@apollo.curekahealth.in",
      "full_name": "Dr. Apurva Mehta",
      "role": "HOSPITAL_ADMIN",
      "hospital_id": "ap-hospital-123",
      "hospital_name": "Apollo General Hospital",
      "permissions": [
        "manage_staff",
        "view_reports",
        "manage_settings"
      ]
    },
    "access_token": "eyJ0e...",
    "refresh_token": "eyJ0e...",
    "token_type": "Bearer"
  }
}
```

---

### Story 3: Hospital Admin Creates Doctor
**Who**: Hospital Admin
**When**: When a new doctor joins the hospital

```bash
# Admin creates doctor account (with bearer token)
curl -X POST http://localhost:3000/api/v1/doctors \
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJ0e..." \  # Use token from login
-d '{
  "first_name": "Dr. Priya",
  "last_name": "Sharma",
  "full_name": "Dr. Priya Sharma",
  "specialization": "Cardiology",
  "license_number": "CARD2024/001",
  "email": "drpriya.sharma@apollo.curekahealth.pharm",
  "phone": "+919876543210",
  "gender": "female",
  "date_of_birth": "1985-05-15",
  "hospital_id": "ap-hospital-123"
}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "doctor-priya-789",
    "email": "drpriya.sharma@apollo.curekahealth.pharm",
    "full_name": "Dr. Priya Sharma",
    "specialty": "Cardiology",
    "hospital_id": "ap-hospital-123",
    "role": "DOCTOR",
    "permissions": [
      "read_patients",
      "write_prescriptions",
      "manage_schedule",
      "view_insights"
    ],
    "requires_first_login": true
  }
}
```

**📝 Important:**
- Doctor email must follow: doctorname@hospitalname.curekahealth.pharm
- Hospital Admin can only create staff for their own hospital
- Doctors get temporary passwords to login
- First login requires password change

---

### Story 4: Doctor Login Flow
**Who**: Doctor
**When**: When doctor receives temporary credentials

```bash
# Doctor login with temporary password
curl -X POST http://localhost:3000/api/v1/auth/staff/login \
-H "Content-Type: application/json" \
-d '{
  "email": "drpriya.sharma@apollo.curekahealth.pharm",
  "password": "TemporaryPassword123!"
}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "doctor-priya-789",
      "email": "drpriya.sharma@apollo.curekahealth.pharm",
      "full_name": "Dr. Priya Sharma",
      "role": "DOCTOR",
      "hospital_id": "ap-hospital-123",
      "hospital_name": "Apollo General Hospital",
      "permissions": [
        "read_patients",
        "write_prescriptions",
        "manage_schedule",
        "view_insights"
      ]
    },
    "access_token": "eyJ0e...",
    "refresh_token": "eyJ0e...",
    "token_type": "Bearer"
  }
}
```

---

### Story 5: Similar Flow for Pharmacists
**Who**: Hospital Admin
**When**: When pharmacist joins

Pharmacists follow the same pattern:

1. **Create pharmacist**: Admin creates with email `pharmacist.name@hospital.curekahealth.pharm`
2. **Temporary credentials**: Same as doctors
3. **Login**: Uses `/api/v1/auth/staff/login`
4. **Permissions**: Different from doctors (manage prescriptions, inventory, etc.)

---

## 🔄 User Creation vs Login Flow

### Creation Flow (Admin Only)
```
Hospital Creation → Admin Setup → Staff Creation
                                    ↓
Temporary Password Generated ← Admin Creates Staff
                                    ↓
Admin Shares Credentials ← Email/SMS
```

### Login Flow (All Valid Staff)
```
Staff Receives Credentials → Login Attempt → Password Verification
                                    ↓
Successful Login → Access Token Generated
```

---

## 🔐 Authentication Methods

### 1. Hospital Admin (Email + Password)
```bash
curl -X POST http://localhost:3000/api/v1/auth/staff/login \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@apollo.curekahealth.in",
  "password": "admin-password"
}'
```

### 2. Doctor (Email + Password)
```bash
curl -X POST http://localhost:3000/api/v1/auth/staff/login \
-H "Content-Type: application/json" \
-d '{
  "email": "doctor.johnson@apollo.curekahealth.pharm",
  "password": "doctor-password"
}'
```

### 3. Pharmacist (Email + Password)
```bash
curl -X POST http://localhost:3000/api/v1/auth/staff/login \
-H "Content-Type: application/json" \
-d '{
  "email": "pharmacist.smith@apollo.curekahealth.pharm",
  "password": "pharm-password"
}'
```

---

## 🎯 User Stories Implementation

### Story: "Hospital Admin wants to create a new doctor"
```
Step 1: Admin logs in to get token
Step 2: Admin calls doctor creation API
Step 3: System validates admin token
Step 4: System checks admin has permission
Step 5: System validates doctor email format
Step 6: System creates doctor user
Step 7: System returns temporary password
Step 8: Admin shares password with doctor via secure channel
```

### Story: "Doctor logs in for first time"
```
Step 1: Doctor receives temporary password
Step 2: Doctor tries to login
Step 3: System validates credentials
Step 4: System generates access/refresh tokens
Step 5: Doctor gets JWT token for API access
Step 6: On first login, system prompts for password change
```

---

## 🎮 Testing Workflow

### Test Hospital Creation
```bash
# Create hospital
curl -X POST http://localhost:3000/api/v1/hospitals \
-H "Content-Type: application/json" \
-d '{
  "hospital_name": "My Hospital",
  "admin_email": "admin@myhospital.curekahealth.in",
  "admin_full_name": "Dr. Admin"
}'
```

### Test Admin Login
```bash
# Admin login
curl -X POST http://localhost:3000/api/v1/auth/staff/login \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@myhospital.curekahealth.in",
  "password": "TemporaryPassword123!"
}'
```

### Test Create Doctor
```bash
# Get token from admin login first
curl -X POST http://localhost:3000/api/v1/doctors \
-H "Content-Type: application/json" \
-H "Authorization: Bearer eyJ0e..." \
-d '{
  "first_name": "Dr. Sarah",
  "last_name": "Johnson",
  "specialization": "Cardiology",
  "license_number": "CARD2024/015",
  "email": "drsarah.johnson@myhospital.curekahealth.pharm",
  "phone": "+919876543210",
  "gender": "female",
  "date_of_birth": "1985-05-15",
  "hospital_id": "hospital-id"
}'
```

---

## 📊 Summary

| User Type | Created By | Authentication | Email Format | Initial Auth |
|-----------|------------|--------------|--------------|--------------|
| Patient | Self | Phone + OTP | Not applicable | Phone OTP |
| Hospital Admin | System Admin | Email + Password | admin@{hospital}.curekahealth.in | Temporary Password |
| Doctor | Hospital Admin | Email + Password | doctor.name@{hospital}.curekahealth.pharm | Temporary Password |
| Pharmacist | Hospital Admin | Email + Password | pharmacist.name@{hospital}.curekahealth.pharm | Temporary Password |

---

## 🚀 Next Steps

1. **Set up hospital** using hospital creation API
2. **Login as admin** using staff login endpoint
3. **Create staff** (doctors/pharmacists) using respective endpoints
4. **Share credentials** with staff via secure channels
5. **Staff login** with their email and temporary password

All staff members (Admin, Doctor, Pharmacist) use the same login endpoint: `/api/v1/auth/staff/login` but with different email formats.