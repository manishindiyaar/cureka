# User Flow: Appointment Booking with Curl Requests

## Prerequisites
You need:
1. JWT Token from login (obtain patient token)
2. Doctor ID (fetch from hospital)
3. Cal.com API key configured in environment

## Step 1: User Registration/Login

### Register a new patient (if needed)
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "1234567890",
    "email": "patient@example.com",
    "fullName": "John Patient",
    "role": "PATIENT"
  }'
```

### Login to get JWT token
```bash
curl -X POST http://localhost:3000/api/v1/auth/login-patient \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "1234",
    "number": "919373675705"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

## Step 2: Get Available Doctors

### Get list of doctors in a hospital
```bash
curl -X GET http://localhost:3000/api/v1/hospitals/{hospital_id}/doctors \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "id": "doc-123",
        "specialization": "Cardiology",
        "profile": {
          "fullName": "Dr. Sarah Smith"
        }
      }
    ]
  }
}
```

## Step 3: Check Available Time Slots

### Get available time slots for a doctor on a specific date
```bash
curl -X GET "http://localhost:3000/api/v1/appointments/available-slots?doctor_id={doctor_id}&date=2025-09-25" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "doctor_id": "doc-123",
    "date": "2025-09-25",
    "available_slots": ["09:00", "09:30", "10:00", "10:30"],
    "doctor_name": "Dr. Sarah Smith",
    "specialty": "Cardiology"
  }
}
```

## Step 4: Book an Appointment

### Create a new appointment
```bash
curl -X POST http://localhost:3000/api/v1/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "doctor_id": "doc-123",
    "appointment_datetime": "2025-09-25T10:00:00Z",
    "appointment_type": "CONSULTATION",
    "notes": "Headache for 3 days, need consultation"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "appointment_id": "apt-456",
    "cal_booking_id": "cal-789",
    "doctor": {
      "doctor_id": "doc-123",
      "name": "Dr. Sarah Smith",
      "specialty": "Cardiology"
    },
    "patient": {
      "patient_id": "pat-789",
      "name": "John Patient"
    },
    "appointment_details": {
      "datetime": "2025-09-25T10:00:00Z",
      "duration_minutes": 30,
      "appointment_type": "CONSULTATION",
      "status": "SCHEDULED",
      "appointment_number": "AID-20250925-0001"
    },
    "meeting_links": {
      "video_conference_url": "https://meet.cal.com/doctor/abc123",
      "cal_event_link": "https://cal.com/doctor/event/abc123"
    }
  }
}
```

## Step 5: View Appointment Details

### Get a specific appointment
```bash
curl -X GET http://localhost:3000/api/v1/appointments/{appointment_id} \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": "apt-456",
      "calBookingId": "cal-789",
      "status": "SCHEDULED",
      "startTs": "2025-09-25T10:00:00Z",
      "endTs": "2025-09-25T10:30:00Z",
      "doctor": {
        "id": "doc-123",
        "profile": {
          "fullName": "Dr. Sarah Smith"
        }
      },
      "appointment_type": "CONSULTATION"
    }
  }
}
```

## Step 6: Update Appointment Status

### Mark appointment as COMPLETED after consultation
```bash
curl -X PATCH http://localhost:3000/api/v1/appointments/{appointment_id}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "status": "COMPLETED"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment status updated successfully",
  "data": {
    "id": "apt-456",
    "status": "COMPLETED"
  }
}
```

## Step 7: Cancel an Appointment

### Patient cancels their appointment
```bash
curl -X DELETE http://localhost:3000/api/v1/appointments/{appointment_id} \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully"
}
```

## Appointment Validation Rules

1. **Minimum Advance Booking**: 1 hour from current time
2. **Business Hours**: 9:00 AM - 6:00 PM (configurable via Cal.com)
3. **Maximum Future Booking**: 90 days from current date
4. **Appointment Types with Durations**:
   - CONSULTATION: 30 minutes
   - FOLLOWUP: 20 minutes
   - EMERGENCY: 60 minutes
   - SURGERY_CONSULTATION: 45 minutes
   - TELEMEDICINE: 30 minutes
   - PRESCRIPTION_REVIEW: 15 minutes
   - FOLLOW_UP_SURGERY: 30 minutes

## Error Handling Examples

### Validation Error (booking in the past)
```bash
curl -X POST http://localhost:3000/api/v1/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "doctor_id": "doc-123",
    "appointment_datetime": "2025-09-23T08:00:00Z"
  }'
```

**Error Response:**
```json
{
  "success": false,
  "code": "PAST_DATETIME",
  "message": "Appointment must be at least 1 hour from now"
}
```

### Doctor Not Found Error
```json
{
  "success": false,
  "code": "DOCTOR_NOT_FOUND",
  "message": "Doctor not found or inactive"
}
```

### Slot Unavailable Error
```json
{
  "success": false,
  "code": "SLOT_UNAVAILABLE",
  "message": "Selected time slot is not available"
}
```

## Integration Flow with Cal.com

1. **Booking Creation**: When a patient books, system:
   - Validates doctor availability
   - Creates booking in Cal.com API
   - Stores cal_booking_id for future sync

2. **Slot Checking**: When checking availability:
   - Queries Cal.com for doctor availability
   - Filters by business hours
   - Returns available time slots

3. **Cancellation**: When cancelling:
   - Updates local appointment status to CANCELLED
   - Optionally cancels in Cal.com (if implemented via API)

## Webhook Integration (Future)

Cal.com webhooks can notify your system when appointments change:
```bash
# Example webhook endpoint
POST /api/v1/appointments/webhook/cal
# Cal.com sends webhook data when appointments are updated/cancelled
```

## Testing Tips

1. **Use Postman or similar tools** for easier testing
2. **Set appropriate JWT token** in Authorization header
3. **Configure Cal.com API key** in environment variables
4. **Test with real Cal.com account** for full integration testing
5. **Check Prisma Studio** to verify data in database