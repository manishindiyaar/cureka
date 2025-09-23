# Complete API Testing Guide

This guide provides comprehensive curl test commands for every endpoint in the Cureka API.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication Required
Most endpoints require authentication headers after login. See the auth section below.

## 1. Health Check

### Check Server Status
```bash
curl -X GET http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 2. Auth - Patient Authentication

### 2.1 Request OTP (Patient)
```bash
curl -X POST http://localhost:3000/api/v1/auth/patient/otp/request \
-H "Content-Type: application/json" \
-d '{
  "phone_number": "+919373675705",
  "user_type": "patient"
}'
```

**Phone Requirements:**
- Must start with `+91`
- Valid Indian mobile number format

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**On Failure:**
- Rate limited (429): "Too many OTP requests. Please try again after 15 minutes."
- Invalid format (400): "Phone number must be in E.164 format starting with +91"

### 2.2 Verify OTP (Patient)
```bash
curl -X POST http://localhost:3000/api/v1/auth/patient/otp/verify \
-H "Content-Type: application/json" \
-d '{
  "phone_number": "+919373675705",
  "otp_code": "7383"
}'
```

**OTP Requirements:**
- Must be exactly 4 numeric digits

**Expected Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "uuid-string",
      "phone_number": "+919373675705",
      "full_name": null
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 86400
  }
}
```

**On Failure:**
- Invalid OTP (400): "Invalid OTP"
- Expired OTP (400): "OTP has expired"
- Validation error (400): "OTP must be 4 digits"

## 3. Auth - Staff Authentication

### 3.1 Staff Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/staff/login \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@hospital.curekahealth.in",
  "password": "doctor12345"
}'
```

**Email Requirements:**
- Must follow pattern: admin@{hospital}.curekahealth.in

**Password Requirements:**
- No specific validation (handled in service layer)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "staff-uuid",
      "email": "admin@hospital.curekahealth.in",
      "full_name": "Dr. John Doe",
      "role": "ADMIN",
      "hospital_id": "hospital-uuid",
      "hospital_name": "Apollo Hospital",
      "permissions": ["manage_patient", "manage_staff", "view_reports"]
    },
    "access_token": "eyJ0eXAiOiJ...",
    "refresh_token": "eyJ0eXAiOiJ...",
    "token_type": "Bearer"
  }
}
```

## 4. Hospitals Management

### 4.1 Create Hospital
```bash
curl -X POST http://localhost:3000/api/v1/hospitals \
-H "Content-Type: application/json" \
-d '{
  "hospital_name": "Apollo General Hospital",
  "admin_email": "admin@apollo.curekahealth.in",
  "admin_full_name": "Dr. Apurva Mehta"
}'
```

**Field Requirements:**
- `hospital_name`: 3-100 characters
- `admin_email`: Must follow format admin@{hospital}.curekahealth.in
- `admin_full_name`: 2-50 characters

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "hospital": {
      "id": "hospital-uuid",
      "name": "Apollo General Hospital",
      "created_at": "2024-01-01T12:00:00.000Z",
      "updated_at": "2024-01-01T12:00:00.000Z"
    },
    "admin": {
      "id": "admin-user-uuid",
      "email": "admin@apollo.curekahealth.in",
      "role": "ADMIN",
      "created_at": "2024-01-01T12:00:00.000Z"
    },
    "temporary_password": "TEMPHASH123456"
  },
  "message": "Hospital and admin account created successfully. Temporary credentials generated."
}
```

### 4.2 Get Hospital by ID
```bash
curl -X GET http://localhost:3000/api/v1/hospitals/{hospital-id}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "hospital": {
      "id": "hospital-uuid",
      "name": "Apollo General Hospital",
      "created_at": "2024-01-01T12:00:00.000Z",
      "updated_at": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

## 5. Doctors Management

### 5.1 Create Doctor
```bash
curl -X POST http://localhost:3000/api/v1/doctors \
-H "Content-Type: application/json" \
-d '{
  "firstName": "Dr. Priya",
  "lastName": "Sharma",
  "specialization": "Cardiology",
  "licenseNumber": "MDC2024/0156",
  "email": "drpriya.sharma@email.com",
  "phone": "+919876543210",
  "gender": "female",
  "dateOfBirth": "1985-05-15",
  "hospital_id": "hospital-uuid"
}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "doctor": {
      "id": "doctor-uuid",
      "firstName": "Dr. Priya",
      "lastName": "Sharma",
      "specialization": "Cardiology",
      "licenseNumber": "MDC2024/0156",
      "email": "drpriya.sharma@email.com",
      "phone": "+919876543210",
      "gender": "female",
      "dateOfBirth": "1985-05-15",
      "hospitalId": "hospital-uuid",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  },
  "message": "Doctor registered successfully"
}
```

### 5.2 Get Doctor by ID
```bash
curl -X GET http://localhost:3000/api/v1/doctors/{doctor-id}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "doctor": {
      "id": "doctor-uuid",
      "firstName": "Dr. Priya",
      "lastName": "Sharma",
      "specialization": "Cardiology",
      "licenseNumber": "MDC2024/0156",
      "email": "drpriya.sharma@email.com",
      "phone": "+919876543210",
      "gender": "female",
      "dateOfBirth": "1985-05-15",
      "hospitalId": "hospital-uuid",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

## Testing Common Error Scenarios

### Rate Limiting Test
```bash
# Make multiple rapid requests
for i in {1..6}; do echo "Request $i:"; curl -X POST http://localhost:3000/api/v1/auth/patient/otp/request -H "Content-Type: application/json" -d '{"phone_number":"+919000000000","user_type":"patient"}' -s | python -m json.tool; sleep 1; done
```

### Invalid Phone Number
```bash
curl -X POST http://localhost:3000/api/v1/auth/patient/otp/request \
-H "Content-Type: application/json" \
-d '{"phone_number":"12345","user_type":"patient"}'
```

**Expected Response (400):**
```json
{
  "success": false,
  "code": "invalid_phone_format",
  "message": "Phone number must be in E.164 format starting with +91"
}
```

### Invalid OTP Format
```bash
curl -X POST http://localhost:3000/api/v1/auth/patient/otp/verify \
-H "Content-Type: application/json" \
-d '{"phone_number":"+919373675705","otp_code":"123"}'
```

**Expected Response (400):**
```json
{
  "success": false,
  "code": "invalid_otp_format",
  "message": "Invalid request format",
  "errors": [
    {
      "type": "field",
      "msg": "OTP must be 4 digits",
      "path": "otp_code"
    }
  ]
}
```

## Environment Setup

Before testing, ensure your `.env` file contains:
```env
# Twilio credentials for SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+your_twilio_number

# JWT secrets
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# OTP settings
OTP_EXPIRY_MINUTES=5
MAX_OTP_ATTEMPTS=5

# Application
NODE_ENV=development
PORT=3000
```

## Running the Tests

1. Start your server:
```bash
npm run dev
```

2. Run individual curl commands as shown above
3. Check responses match expected outputs
4. For bulk testing, copy commands and modify parameters as needed

## Notes

- All phone numbers must be Indian (+91 prefix)
- OTPs expire after 5 minutes
- Rate limiting allows 5 requests per 15-minute window per phone number
- After successful verification, tokens expire in 24 hours (access) and 7 days (refresh)
- Hospitals can only be created with admin email in format admin@{hospital}.curekahealth.in