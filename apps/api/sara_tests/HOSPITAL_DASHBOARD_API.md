# Hospital Dashboard API Guide

This guide documents the new hospital dashboard endpoints that allow hospital administrators to manage their staff and view hospital statistics.

## 📊 New Endpoints

### 1. Get Dashboard Overview
**URL**: `GET /api/v1/hospitals/dashboard/overview`
**Auth Required**: Hospital Admin
**Description**: Get hospital statistics and overview information

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/hospitals/dashboard/overview \
-H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "hospital": {
      "id": "hospital-123",
      "name": "Apollo General Hospital",
      "created_at": "2024-01-01T12:00:00.000Z"
    },
    "stats": {
      "total_staff": 15,
      "admin": 1,
      "doctors": 8,
      "pharmacists": 6
    }
  }
}
```

### 2. Get Staff List
**URL**: `GET /api/v1/hospitals/dashboard/staff`
**Auth Required**: Hospital Admin
**Description**: List all staff members for the hospital

**Optional Query Parameters:**
- `role` - Filter by role (DOCTOR, PHARMACIST)

**Request:**
```bash
# Get all staff
curl -X GET http://localhost:3000/api/v1/hospitals/dashboard/staff \
-H "Authorization: Bearer YOUR_TOKEN"

# Get only doctors
curl -X GET http://localhost:3000/api/v1/hospitals/dashboard/staff?role=DOCTOR \
-H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "id": "doctor-123",
        "email": "dr.smith@apollo.curekahealth.pharm",
        "role": "DOCTOR",
        "is_active": true,
        "created_at": "2024-01-02T08:00:00.000Z",
        "full_name": "Dr. John Smith",
        "specialization": "Cardiology",
        "phone_number": "+917654321098"
      }
    ],
    "total": 8,
    "role": "DOCTOR"
  }
}
```

### 3. Add New Doctor
**URL**: `POST /api/v1/hospitals/dashboard/doctors`
**Auth Required**: Hospital Admin
**Description**: Create a new doctor account for the hospital

**Request Body:**
```json
{
  "first_name": "Dr. Ramesh",
  "last_name": "Kumar",
  "full_name": "Dr. Ramesh Kumar",
  "specialization": "Orthopedics",
  "license_number": "ORTHO2024/007",
  "email": "dr.ramesh@apollo.curekahealth.pharm",
  "phone": "+919876543215",
  "gender": "male",
  "date_of_birth": "1982-08-15",
  "hospital_id": "apollo-hospital-123"
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/hospitals/dashboard/doctors \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "first_name": "Dr. Ramesh",
  "last_name": "Kumar",
  "specialization": "Orthopedics",
  "license_number": "ORTHO2024/007",
  "email": "dr.ramesh@apollo.curekahealth.pharm",
  "phone": "+919876543215",
  "gender": "male",
  "date_of_birth": "1982-08-15",
  "hospital_id": "apollo-hospital-123"
}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "doctor-456",
    "email": "dr.ramesh@apollo.curekahealth.pharm",
    "full_name": "Dr. Ramesh Kumar",
    "specialty": "Orthopedics",
    "hospital_id": "apollo-hospital-123",
    "role": "DOCTOR",
    "permissions": [
      "read_patients",
      "write_prescriptions",
      "manage_schedule",
      "view_insights"
    ],
    "temporary_password": "T8mP@Pass123!",
    "requires_password_change": true
  }
}
```

---

## 🔒 Security & Authorization

### Authentication
- Hospital admin must be logged in
- Pass JWT token in Authorization header: `Bearer YOUR_TOKEN`

### Authorization
- Only `HOSPITAL_ADMIN` role can access these endpoints
- Hospital admins can only manage staff for their own hospital
- Email format validation for staff members

### Email Format for Staff
- Doctors: `[firstname.lastname]@[hospital].curekahealth.pharm`
- Pharmacists: `[firstname.lastname]@[hospital].curekahealth.pharm`
- Hospital Admin: `[admin]@[hospital].curekahealth.in`

---

## 🧪 Testing the APIs

Before testing, ensure:
1. Supabase is running: `supabase start`
2. Hospital created: `/api/v1/hospitals` (system admin)
3. Hospital admin logged in: `/api/v1/auth/staff/login`

```bash
# 1. Start server
npm run dev

# 2. Login as hospital admin and get token
curl -X POST http://localhost:3000/api/v1/auth/staff/login \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@yourhospital.curekahealth.in",
  "password": "your-password"
}'

# 3. Use the token to call dashboard APIs
curl -X GET http://localhost:3000/api/v1/hospitals/dashboard/overview \
-H "Authorization: Bearer YOUR_TOKEN_HERE"

# 4. Add new doctor
curl -X POST http://localhost:3000/api/v1/hospitals/dashboard/doctors \
-H "Authorization: Bearer YOUR_TOKEN_HERE" \
-H "Content-Type: application/json" \
-d '{
  "first_name": "Dr. Test",
  "last_name": "Doctor",
  "specialization": "General Medicine",
  "license_number": "TEST2024/001",
  "email": "dr.test@yourhospital.curekahealth.pharm",
  "phone": "+919999999999",
  "gender": "male",
  "date_of_birth": "1990-01-01"
}'
```

---

## 🎯 Key Features

1. **Dashboard Overview** - Statistics about hospital staff
2. **Staff Management** - View all doctors and pharmacists
3. **Doctor Creation** - Add new doctors with temporary credentials
4. **Security** - JWT authentication with hospital-specific authorization
5. **Temporary Passwords** - New staff receive passwords for first login

---

## 🔗 Integration Example

After creating a doctor, the doctor can login using:
```bash
curl -X POST http://localhost:3000/api/v1/auth/staff/login \
-H "Content-Type: application/json" \
-d '{
  "email": "dr.ramesh@yourhospital.curekahealth.pharm",
  "password": "T8mP@Pass123!"
}'
```

On first login, the doctor will be prompted to change their temporary password.