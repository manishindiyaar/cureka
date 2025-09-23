<[
\---
title: "Story D1: Create Doctor Appointment"
epic: "Epic D: Scheduling & Appointments"
priority: "High"
status: "Draft"
as_a: "A patient user"
so_i_can: "Book an appointment with a doctor"
in_order_to: "See the doctor at a scheduled time"
---

## Story
As a user authenticated as a patient, I want to book an appointment with a doctor so that I can see them at a scheduled time for consultation or treatment.

## Acceptance Criteria
1. **Input Validation**
   - Required fields: doctor_id, patient_id (from JWT), appointment_date_time
   - Optional: appointment_type, notes
   - appointment_date_time must be in future (minimum 1 hour ahead)
   - doctor_id must exist and have 'DOCTOR' role
   - patient_id must match authenticated user from JWT
   - Validate appointment slot is available (using Cal.com API)

2. **Availability Check**
   - Integrates with Cal.com API to check doctor availability
   - Validates time slot is within doctor's business hours
   - Prevents double-booking same time slot
   - Returns error if slot is unavailable

3. **Booking Creation**
   - Creates booking in Cal.com via REST API
   - Syncs with local appointments table
   - Generates unique appointment number (format: AID-{YYYYMMDD}-{SEQ})
   - Sets initial status as 'SCHEDULED'

4. **Success Response**
   ```json
   {
     "success": true,
     "data": {
       "appointment_id": "AID-20250921-0001",
       "cal_booking_id": "12345678-cal",
       "doctor": {
         "doctor_id": "doc-abc123",
         "name": "Dr. Priya Patel",
         "specialty": "Cardiology"
       },
       "patient": {
         "patient_id": "pat-def456",
         "name": "Rajesh Kumar"
       },
       "appointment_details": {
         "datetime": "2025-09-23T14:30:00+05:30",
         "duration_minutes": 30,
         "appointment_type": "consultation",
         "status": "scheduled",
         "appointment_number": "AID-20250921-0001"
       },
       "meeting_links": {
         "video_conference_url": "https://zoom.link/abc123",
         "cal_event_link": "https://cal.com/schedule/meeting-link"
       }
     }
   }
   ```

## Technical Context

### Key Dependencies
```bash
npm install @calcom/api axios date-fns uuid cron job-queue
```

### Key Files to Create
```
apps/api/src/
├── api/v1/appointments/
│   ├── appointments.controller.ts
│   ├── appointments.service.ts
│   ├── appointments.validation.ts
│   └── appointments.dto.ts
├── services/
│   ├── calcom.service.ts
│   ├── availability.service.ts
│   └── scheduler.service.ts
└── jobs/
    ├── appointment-sync.job.ts
    └── reminder.service.ts
```

### Cal.com API Configuration
```typescript
interface CalComEvent {
  type: '60-min',
  title: 'Medical Consultation',
  slug: 'medical-consultation',
  length: 60,
  preEventBooker: [{
    name: 'doctor_notes',
    required: false
  }],
  metadata: {
    customInputs: [{
      label: 'Appointment number',
      defaultValue: { meetingId: '{{appointment_number}}' }
    }]
  }
}
```

### Appointment Types
```typescript
export const APPOINTMENT_TYPES = {
  CONSULTATION: { value: 'consultation', duration: 30, cal_type: '30-min' },
  FOLLOWUP: { value: 'followup', duration: 20, cal_type: '30-min' },
  EMERGENCY: { value: 'emergency', duration: 60, cal_type: '60-min' },
  SURGERY_CONSULTATION: { value: 'surgery', duration: 45, cal_type: '45-min' }
};
```

### Environment Variables
```bash
# Cal.com Integration
CAL_COM_API_KEY=cal_live_abc123
CAL_COM_WEBHOOK_SECRET=webhook_secret_xyz789
CAL_COM_BASE_URL=https://api.cal.com/v1
CAL_COM_WEBHOOK_URL=https://api.cureka.health/webhooks/cal

# Appointment Settings
MAX_FUTURE_BOOKING_DAYS=60
MIN_ADVANCE_BOOKING_HOURS=1
MAX_APPTS_PER_PATIENT=10
DEFAULT_APPOINTMENT_DURATION=30
APPOINTMENT_NUMBER_PREFIX=AID
```

## Implementation Steps

### Step 1: Request Validation
```typescript
// apps/api/src/api/v1/appointments/appointments.validation.ts
export const createAppointmentValidation = [
  body('doctor_id')
    .isUUID(4)
    .withMessage('Doctor ID must be valid UUID'),
  body('appointment_datetime')
    .isISO8601()
    .toDate()
    .isAfter(new Date(Date.now() + 60 * 60 * 1000).toISOString()) // 1 hour ahead
    .withMessage('Appointment must be at least 1 hour from now'),
  body('appointment_type')
    .isIn(Object.values(APPOINTMENT_TYPES))
    .withMessage('Appointment type must be valid'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Custom validation middleware
export const validateAppointmentSlot = async (req: Request, res: Response, next: NextFunction) => {
  const { appointment_datetime, doctor_id } = req.body;
  const patientId = req.user.id;

  // Check if slot is available
  const isAvailable = await availabilityService.checkAvailability(
    doctor_id,
    new Date(appointment_datetime),
    APPOINTMENT_TYPES[req.body.appointment_type || 'CONSULTATION'].duration
  );

  if (!isAvailable) {
    return res.status(409).json({
      success: false,
      code: 'SLOT_UNAVAILABLE',
      message: 'Selected time slot is not available'
    });
  }

  next();
};
```

### Step 2: Cal.com Integration Service
```typescript
// apps/api/src/services/calcom.service.ts
export class CalComService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.CAL_COM_BASE_URL,
      headers: {
        'Authorization': `Bearer ${process.env.CAL_COM_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createBooking(bookingRequest: CalBookingRequest): Promise<CalBookingResponse> {
    const payload = {
      type: APPOINTMENT_TYPES[bookingRequest.appointment_type].cal_type,
      start: bookingRequest.datetime.toISOString(),
      eventTypeId: bookingRequest.event_type_id || 1, // Default medical consult
      member: {
        connectId: bookingRequest.doctor_cal_com_id
      },
      customInputs: {
        appointment_number: bookingRequest.appointment_number,
        doctor_id: bookingRequest.doctor_id,
        patient_id: bookingRequest.patient_id
      },
      metadata: {
        appointmentNumber: bookingRequest.appointment_number,
        notes: bookingRequest.notes,
        createdBy: 'api',
        createdAt: new Date().toISOString()
      }
    };

    const response = await this.api.post('/bookings', payload);

    if (response.status !== 201) {
      throw new CalComError('CAL_COM_BOOKING_FAILED', 'Failed to create Cal.com booking');
    }

    return {
      booking_id: response.data.booking.id,
      meeting_url: response.data.booking.meeting_url,
      ics_url: response.data.booking.ics_url,
      confirm_link: response.data.booking.confirm_link,
      reminder: response.data.booking.reminder
    };
  }

  async checkDoctorAvailability(doctorId: string, datetime: Date): Promise<boolean> {
    const response = await this.api.get('/availability', {
      params: {
        userId: doctorId,
        date: datetime.toISOString().split('T')[0]
      }
    });

    const availableSlots = response.data.availability.slots;
    const requestedTime = datetime.toTimeString().substring(0, 5); // HH:MM

    return availableSlots.includes(requestedTime);
  }

  async cancelBooking(bookingId: string): Promise<boolean> {
    const response = await this.api.delete(`/bookings/${bookingId}`);
    return response.status === 200;
  }
}
```

### Step 3: Availability Check Service
```typescript
// apps/api/src/services/availability.service.ts
export class AvailabilityService {
  constructor(
    private calComService: CalComService,
    private redis: RedisClient,
    private supabase: SupabaseClient
  ) {}

  async checkAvailability(doctorId: string, datetime: Date, duration: number): Promise<{
    available: boolean;
    alternative_slots?: string[];
    reason?: string
  }> {
    // Check Redis cache first
    const cacheKey = `availability:${doctorId}:${datetime.toISOString()}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Check doctor exists and has availability
    const doctorResult = await this.supabase
      .from('users')
      .select('cal_com_id, availability')
      .eq('id', doctorId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorResult.error || !doctorResult.data) {
      return { available: false, reason: 'Doctor not found' };
    }

    // Check existing bookings
    const existingBookings = await this.supabase
      .from('appointments')
      .select('appointment_datetime')
      .eq('doctor_id', doctorId)
      .eq('status', 'SCHEDULED')
      .gte('appointment_datetime', datetime)
      .lt('appointment_datetime', new Date(datetime.getTime() + duration * 60000));

    if (existingBookings.data && existingBookings.data.length > 0) {
      return { available: false, reason: 'Slot already booked' };
    }

    // Check business hours
    const isBusinessHours = this.isWithinBusinessHours(datetime);
    if (!isBusinessHours) {
      return {
        available: false,
        reason: 'Outside business hours',
        alternative_slots: await this.getAlternativeSlots(doctorId, datetime)
      };
    }

    // Check Cal.com availability
    const isAvailableInCal = await this.calComService.checkDoctorAvailability(
      doctorResult.data.cal_com_id!,
      datetime
    );

    const result = {
      available: isAvailableInCal,
      alternative_slots: isAvailableInCal ? undefined : await this.getNextSlots(doctorId, datetime)
    };

    // Cache result for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(result));

    return result;
  }

  private isWithinBusinessHours(datetime: Date): boolean {
    const hour = datetime.getHours();
    return hour >= 9 && hour < 18; // 9 AM to 6 PM
  }

  private async getAlternativeSlots(doctorId: string, baseDateTime: Date): Promise<string[]> {
    const slots = [];
    for (let i = 0; i < 5; i++) {
      const nextSlot = new Date(baseDateTime.getTime() + (i + 1) * 30 * 60000); // 30 min intervals
      slots.push(nextSlot.toISOString());
    }
    return slots;
  }
}
```

### Step 4: Appointment Number Generator
```typescript
// apps/api/src/services/appointment-number.service.ts
export class AppointmentNumberService {
  private supabase: SupabaseClient;

  async generateAppointmentNumber(date: Date): Promise<string> {
    // Get current date sequence (e.g., YYYYMMDD)
    const datePart = date.toISOString().split('T')[0].replace(/-/g, '');

    // Get next sequence from database
    const { data, error } = await this.supabase
      .rpc('get_next_appointment_sequence', { date_param: datePart });

    if (error) throw new Error('Failed to generate appointment number');

    return `AID-${datePart}-${data[0].next_seq.toString().padStart(4, '0')}`;
  }
}

// PostgreSQL function for atomic sequence generation
const getNextAppointmentSequenceSQL = `
CREATE OR REPLACE FUNCTION get_next_appointment_sequence(date_param TEXT)
RETURNS TABLE(next_seq INTEGER) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO appointment_sequences (sequence_date, next_sequence)
  VALUES (date_param, 1)
  ON CONFLICT (sequence_date)
  DO UPDATE SET next_sequence = appointment_sequences.next_sequence + 1
  RETURNING appointment_sequences.next_sequence;
END;
$$ LANGUAGE plpgsql;
`;
```

## Testing Requirements

### Test File
```bash
apps/api/tests/appointments/
├── appointment-create.test.ts
├── appointment-create.int.test.ts
└── mocks/
    ├── cal-com.mock.ts
    └── availability.mock.ts
```

### Key Test Cases
```typescript
describe('POST /api/v1/appointments', () => {
  describe('Given valid booking request', () => {
    it('should create appointment and booking', async () => {
      // Mock Cal.com API response
      jest.mocked(calComService.createBooking).mockResolvedValue({
        booking_id: 'cal-123456',
        meeting_url: 'https://zoom.link/test'
      });

      const requestData = {
        doctor_id: 'doc-abc123',
        appointment_datetime: '2025-09-23T14:30:00+05:30',
        appointment_type: 'consultation'
      };

      const response = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointment_number).toMatch(/AID-\d{8}-\d{4}/);
      expect(response.body.data.status).toBe('scheduled');
      expect(response.body.data.meeting_links).toBeDefined();
    });
  });

  describe('Given unavailable timeslot', () => {
    it('should return 409 conflict', async () => {
      // Mock slot unavailable
      jest.mocked(availabilityService.checkAvailability).mockResolvedValue({
        available: false,
        reason: 'Slot already booked'
      });

      const response = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(requestData)
        .expect(409);

      expect(response.body.code).toBe('SLOT_UNAVAILABLE');
    });
  });

  describe('Given past datetime', () => {
    it('should return 400 bad request', async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

      const response = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ ...requestData, appointment_datetime: pastDate })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### Integration Test Setup
```typescript
// apps/api/tests/fixtures/cal-com.mock.ts
export const mockCalComAPI = {
  createBookingSuccess: () => ({
    status: 201,
    data: {
      booking: {
        id: 'cal-123456',
        meeting_url: 'https://example.com/meeting',
        confirm_link: 'https://example.com/confirm',
        remind_later: true
      }
    }
  }),

  checkAvailabilitySuccess: () => ({
    status: 200,
    data: {
      availability: {
        slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
        date: '2025-09-23'
      }
    }
  })
};
```

## Error Codes
```typescript
const APPOINTMENT_ERROR_CODES = {
  SLOT_UNAVAILABLE: { code: 'SLOT_UNAVAILABLE', status: 409, message: 'Selected time slot is not available' },
  DOCTOR_NOT_FOUND: { code: 'DOCTOR_NOT_FOUND', status: 404, message: 'Doctor not found or inactive' },
  BUSINESS_HOURS: { code: 'OUTSIDE_BUSINESS_HOURS', status: 409, message: 'Appointment outside business hours' },
  CAL_COM_ERROR: { code: 'CAL_COM_ERROR', status: 503, message: 'Calendar service is temporarily unavailable' },
  PAST_DATETIME: { code: 'PAST_DATETIME', status: 400, message: 'Cannot book past appointments' }
};
```

## Background Jobs
```typescript
// Periodic sync job (every 15 minutes)
cron.schedule('*/15 * * * *', async () => {
  await syncAppointmentsWithCalCom();
});

// Calendar sync function
async function syncAppointmentsWithCalCom() {
  // Fetch recent bookings from Cal.com
  const calBookings = await calComService.getRecentBookings();

  // Update local database
  for (const booking of calBookings) {
    await updateOrCreateAppointmentMapping(booking);
  }
}
```

## Post-Implementation Checklist
- [ ] All unit tests pass
- [ ] Integration tests with Cal.com API
t [ ] Timeout handling (30 seconds max)
- [ ] Rate limiting (5 bookings per minute per patient)
- [ ] Appointment number uniqueness verified
- [ ] Alternative time slots suggested
- [ ] Performance under load (<200ms)
- [ ] Appointment sync job running
- [ ] Webhook endpoint ready for Cal.com updates]>