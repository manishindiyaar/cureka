<[
\---
title: "Story E1: Create Prescription"
epic: "Epic E: Prescription Workflow"
priority: "High"
status: "Draft"
as_a: "An authenticated doctor"
so_i_can: "Create a prescription for my patient"
in_order_to: "Prescribe medication for their treatment"
---

## Story
As a doctor authenticated in the system, I want to create a prescription for my patient so that I can provide them with medication for their treatment.

## Acceptance Criteria
1. **Input Validation**
   - Required fields: patient_id, doctor_id (from JWT), medications array
   - patient_id must exist and have role 'PATIENT'
   - Each medication must include: name, dosage, frequency, duration
   - Notes field is optional (max 1000 characters)
   - Linked appointment_id is optional (must exist if provided)

2. **Patient and Doctor Verification**
   - Verify patient exists and has role 'PATIENT'
   - Verify doctor has appropriate permissions
   - Doctor must be authorized to prescribe to this patient
   - If appointment linked, verify it exists and doctor matches

3. **Prescription Creation**
   - Generate unique prescription ID (format: RX-{YYYYMMDD}-{SEQ})
   - Set initial status as 'PENDING'
   - Encrypt prescription details at rest
   - Record creation timestamp
   - Link to patient and doctor
   - Send notification to patient

4. **Response Format**
   ```json
   {
     "success": true,
     "data": {
       "prescription": {
         "prescription_id": "RX-20250921-0001",
         "patient": {
           "patient_id": "pat-abc123",
           "name": "Rajesh Kumar"
         },
         "doctor": {
           "doctor_id": "doc-def456",
           "name": "Dr. Priya Patel",
           "specialty": "Cardiology"
         },
         "status": "PENDING",
         "medications": [
           {
             "medication_id": "med-123",
             "name": "Paracetamol",
             "dosage": "500mg",
             "frequency": "Twice daily",
             "duration": "7 days",
             "instructions": "With food"
           }
         ],
         "notes": "For fever and body ache",
         "created_at": "2025-09-21T15:30:00+05:30",
         "expires_at": "2025-10-21T15:30:00+05:30"
       }
     }
   }
   ```

## Technical Context

### Key Dependencies
```bash
npm install crypto node-forge helmet rate-limit
```

### Key Files to Create
```
apps/api/src/
├── api/v1/prescriptions/
│   ├── prescriptions.controller.ts
│   ├── prescriptions.service.ts
│   ├── prescriptions.validation.ts
│   └── prescriptions.dto.ts
├── services/
│   ├── encryption.service.ts
│   ├── prescription.service.ts
│   └── notification.service.ts
└── middleware/
    ├── prescription.middleware.ts
    └── security.middleware.ts
```

### Medication Schema
```typescript
export interface Medication {
  medication_id?: string;
  name: string;          // e.g., "Paracetamol"
  dosage: string;        // e.g., "500mg"
  frequency: string;     // e.g., "Twice daily", "Once at bedtime"
  duration: string;      // e.g., "7 days", "3 weeks"
  instructions?: string; // e.g., "Take with food"
}
```

### Prescription Status Flow
```typescript
export enum PrescriptionStatus {
  PENDING = 'PENDING',           // Created by doctor, awaiting pharmacist action
  APPROVED = 'APPROVED',         // Pharmacist approved, ready for dispensing
  DENIED = 'DENIED',             // Pharmacist denied, requires doctor review
  PARTIALLY_FILLED = 'PARTIALLY_FILLED', // Some medications dispensed
  COMPLETED = 'COMPLETED',       // All medications dispensed
  EXPIRED = 'EXPIRED',           // Prescription expired (30 days default)
  CANCELLED = 'CANCELLED'        // Cancelled by doctor/patient
}
```

### Environment Variables
```bash
# Encryption Settings
PRESCRIPTION_ENCRYPTION_KEY=super-secure-32-char-key-here
PRESCRIPTION_ENCRYPTION_IV=16-byte-iv-here

# Prescription Settings
PRESCRIPTION_EXPIRY_DAYS=30
MAX_MEDICATIONS_PER_PRESCRIPTION=10
DAILY_PRESCRIPTION_LIMIT=50

# Notification Settings
SEND_PRESCRIPTION_NOTIFICATIONS=true
PUSH_NOTIFICATION_SERVICE=firebase
SMS_ENABLED=true
```

## Implementation Steps

### Step 1: Request Validation Schema
```typescript
// apps/api/src/api/v1/prescriptions/prescriptions.validation.ts
export const createPrescriptionValidation = [
  body('patient_id')
    .isUUID(4)
    .withMessage('Patient ID must be a valid UUID'),
  body('medications')
    .isArray({ min: 1, max: 10 })
    .withMessage('Must include 1-10 medications'),
  body('medications.*.name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Medication name required (1-100 chars)'),
  body('medications.*.dosage')
    .isLength({ min: 1, max: 50 })
    .withMessage('Dosage required (1-50 chars)'),
  body('medications.*.frequency')
    .isLength({ min: 1, max: 100 })
    .withMessage('Frequency required (1-100 chars)'),
  body('medications.*.duration')
    .isLength({ min: 1, max: 50 })
    .withMessage('Duration required (1-50 chars)'),
  body('appointment_id')
    .optional()
    .isUUID(4)
    .withMessage('Appointment ID must be valid UUID'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

// Custom authorization middleware
export const verifyDoctorPatientRelationship = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { patient_id, appointment_id } = req.body;
  const doctorId = req.user.id;

  // Verify relationship through appointment if provided
  if (appointment_id) {
    const appointment = await supabase
      .from('appointments')
      .select('doctor_id, patient_id')
      .eq('id', appointment_id)
      .eq('doctor_id', doctorId)
      .single();

    if (!appointment.data || appointment.data.patient_id !== patient_id) {
      return res.status(403).json({
        success: false,
        code: 'INVALID_PATIENT_RELATIONSHIP',
        message: 'Doctor-patient relationship cannot be verified'
      });
    }
  } else {
    // Alternative verification (e.g., same hospital)
    const doctor = await supabase
      .from('users')
      .select('hospital_id')
      .eq('id', doctorId)
      .single();

    const patient = await supabase
      .from('users')
      .select('hospital_id')
      .eq('id', patient_id)
      .eq('role', 'PATIENT')
      .single();

    if (!doctor.data || !patient.data || doctor.data.hospital_id !== patient.data.hospital_id) {
      return res.status(403).json({
        success: false,
        code: 'INVALID_PATIENT_RELATIONSHIP',
        message: 'Doctor and patient do not belong to same hospital'
      });
    }
  }

  next();
};
```

### Step 2: Encryption Service
```typescript
// apps/api/src/services/encryption.service.ts
import * as crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-cbc';
  private key: Buffer;
  private iv: Buffer;

  constructor() {
    this.key = Buffer.from(process.env.PRESCRIPTION_ENCRYPTION_KEY!, 'hex');
    this.iv = Buffer.from(process.env.PRESCRIPTION_ENCRYPTION_IV!, 'hex');
  }

  encrypt(text: string): string {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  hashPrescription(prescriptionData: any): string {
    const dataString = JSON.stringify({
      ...prescriptionData,
      timestamp: new Date().toISOString()
    });
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
}
```

### Step 3: Prescription Creation Logic
```typescript
// apps/api/src/services/prescription.service.ts
export class PrescriptionService {
  private encryptionService = new EncryptionService();

  async createPrescription(prescriptionData: CreatePrescriptionDto, doctorId: string): Promise<Prescription> {
    // 1. Verify patient exists
    const patient = await this.verifyPatient(prescriptionData.patient_id);
    const doctor = await this.verifyDoctor(doctorId);

    // 2. Verify appointment if provided
    if (prescriptionData.appointment_id) {
      await this.verifyAppointment(prescriptionData.appointment_id, doctorId, prescriptionData.patient_id);
    }

    // 3. Generate unique prescription number
    const prescriptionNumber = await this.generatePrescriptionNumber();

    // 4. Encrypt prescription details
    const encryptedMedications = prescriptionData.medications.map(med => ({
      name: this.encryptionService.encrypt(med.name),
      dosage: this.encryptionService.encrypt(med.dosage),
      frequency: this.encryptionService.encrypt(med.frequency),
      duration: this.encryptionService.encrypt(med.duration),
      instructions: med.instructions ? this.encryptionService.encrypt(med.instructions) : null
    }));

    // 5. Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(process.env.PRESCRIPTION_EXPIRY_DAYS || '30'));

    // 6. Create prescription record with transaction
    const result = await supabase.transaction(async (trx) => {
      // Create main prescription record
      const prescriptionRecord = await trx.from('prescriptions')
        .insert({
          id: prescriptionNumber,
          patient_id: prescriptionData.patient_id,
          doctor_id: doctorId,
          appointment_id: prescriptionData.appointment_id,
          status: PrescriptionStatus.PENDING,
          encrypted_data: this.encryptionService.encrypt(JSON.stringify(encryptedMedications)),
          notes: prescriptionData.notes ? this.encryptionService.encrypt(prescriptionData.notes) : null,
          created_at: new Date(),
          expires_at: expiresAt,
          // Audit fields
          created_by: doctorId,
          hash: this.encryptionService.hashPrescription(prescriptionData)
        })
        .select(`
          *,
          doctor:users(id, full_name, specialty),
          patient:users(id, full_name)
        `)
        .single();

      // Create individual medication records for tracking
      const medicationRecords = prescriptionData.medications.map((med, index) => ({
        prescription_id: prescriptionRecord.data.id,
        medication_id: `med_${prescriptionNumber}_${index + 1}`,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || '',
        status: 'PENDING'
      }));

      await trx.from('prescription_medications').insert(medicationRecords);

      return prescriptionRecord;
    });

    // 7. Send notification
    await notificationService.sendPrescriptionNotification(
      prescriptionData.patient_id,
      result.data
    );

    // 8. Return sanitized prescription data
    return this.sanitizePrescription(result.data);
  }

  private async verifyPatient(patientId: string): Promise<any> {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', patientId)
      .eq('role', 'PATIENT')
      .single();

    if (error || !data) {
      throw new PrescriptionError('PATIENT_NOT_FOUND', 'Patient not found');
    }

    return data;
  }

  private async verifyDoctor(doctorId: string): Promise<any> {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, specialty')
      .eq('id', doctorId)
      .eq('role', 'DOCTOR')
      .single();

    if (error || !data) {
      throw new PrescriptionError('DOCTOR_NOT_FOUND', 'Doctor not found');
    }

    return data;
  }

  private async generatePrescriptionNumber(): Promise<string> {
    const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const { data } = await supabase.rpc('get_next_prescription_sequence', { date_param: datePart });
    return `RX-${datePart}-${data[0].next_seq.toString().padStart(4, '0')}`;
  }

  private sanitizePrescription(prescription: any): any {
    // Never return encrypted or sensitive fields
    const sanitized = { ...prescription };
    delete sanitized.encrypted_data;
    delete sanitized.hash;
    delete sanitized.created_by;
    return sanitized;
  }
}
```

### Step 4: Notification Service
```typescript
// apps/api/src/services/notification.service.ts
export class NotificationService {
  async sendPrescriptionNotification(patientId: string, prescription: any) {
    // Get patient notification preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('notifications')
      .eq('user_id', patientId)
      .single();

    if (!preferences?.notifications?.prescriptions) {
      return; // User opted out of prescription notifications
    }

    // Send multiple notification types
    const notifications = [];

    // Push notification
    if (preferences.notifications.push) {
      notifications.push(
        pushService.send({
          userId: patientId,
          title: 'New Prescription',
          body: `Dr. ${prescription.doctor.full_name} has prescribed ${prescription.medications.length} medications`,
          data: {
            type: 'PRESCRIPTION_CREATED',
            prescriptionId: prescription.id
          }
        })
      );
    }

    // SMS notification (if enabled)
    if (preferences.notifications.sms) {
      const { data: patientData } = await supabase
        .from('users')
        .select('phone_number')
        .eq('id', patientId)
        .single();

      if (patientData?.phone_number) {
        notifications.push(
          smsService.send({
            to: patientData.phone_number,
            message: `New prescription from Dr. ${prescription.doctor.full_name}. Check app for details.`
          })
        );
      }
    }

    // Email notification (if enabled)
    if (preferences.notifications.email) {
      const { data: patientData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', patientId)
        .single();

      if (patientData?.email) {
        notifications.push(
          emailService.send({
            to: patientData.email,
            subject: 'New Prescription - Cureka Health',
            template: 'prescription-created',
            data: {
              patientName: patientData.full_name,
              doctorName: prescription.doctor.full_name,
              medicationCount: prescription.medications.length,
              prescriptionId: prescription.id,
              expiryDate: prescription.expires_at
            }
          })
        );
      }
    }

    // Send all notifications concurrently
    await Promise.allSettled(notifications);
  }
}
```

## Testing Requirements

### Test Structure
```
apps/api/tests/prescriptions/
├── prescription-create.test.ts
├── prescription-encryption.test.ts
├── prescription-notification.test.ts
└── mocks/
    ├── prescription-data.mock.ts
    └── notification.mock.ts
```

### Key Test Cases
```typescript
describe('POST /api/v1/prescriptions', () => {
  describe('Given valid prescription request', () => {
    it('should create prescription, encrypt data and send notifications', async () => {
      // Mock encrypted data
      const mockEncrypted = 'encrypted-string-here';
      jest.spyOn(encryptionService, 'encrypt').mockReturnValue(mockEncrypted);

      const prescriptionData = {
        patient_id: 'pat-abc123',
        medications: [
          {
            name: 'Paracetamol',
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '7 days'
          }
        ],
        notes: 'For fever and body ache'
      };

      const response = await request(app)
        .post('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(prescriptionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.prescription.prescription_id).toMatch(/RX-\d{8}-\d{4}/);
      expect(response.body.data.prescription.status).toBe('PENDING');

      // Verify encryption was called
      expect(encryptionService.encrypt).toHaveBeenCalledTimes(4); // 3 for medications + 1 for notes

      // Verify notification was sent
      expect(notificationService.sendPrescriptionNotification).toHaveBeenCalledWith(
        prescriptionData.patient_id,
        expect.objectContaining({
          id: expect.stringMatching(/RX-\d{8}-\d{4}/)
        })
      );
    });
  });

  describe('Given invalid patient ID', () => {
    it('should return 404 not found', async () => {
      const prescriptionData = {
        // Invalid patient_id that doesn't exist
        patient_id: 'invalid-patient-id',
        medications: [validMedication]
      };

      const response = await request(app)
        .post('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(prescriptionData)
        .expect(404);

      expect(response.body.code).toBe('PATIENT_NOT_FOUND');
    });
  });

  describe('Given unauthorized doctor', () => {
    it('should return 403 forbidden', async () => {
      const response = await request(app)
        .post('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${pharmacistToken}`) // Not a doctor
        .send(validPrescriptionData)
        .expect(403);

      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Given too many medications', () => {
    it('should return 400 validation error', async () => {
      const prescriptionData = {
        patient_id: 'pat-abc123',
        medications: Array(15).fill(validMedication) // 15 medications > limit of 10
      };

      const response = await request(app)
        .post('/api/v1/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(prescriptionData)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.message).toContain('1-10 medications');
    });
  });

  describe('Prescription encryption', () => {
    it('should encrypt sensitive prescription data', async () => {
      const sensitiveData = { name: 'Ativan', dosage: '1mg' };
      const encrypted = encryptionService.encrypt(JSON.stringify(sensitiveData));

      // Should not contain plain text
      expect(encrypted).not.toContain('Ativan');
      expect(encrypted).not.toContain('1mg');

      // Should be decryptable
      const decrypted = JSON.parse(encryptionService.decrypt(encrypted));
      expect(decrypted.name).toBe('Ativan');
      expect(decrypted.dosage).toBe('1mg');
    });
  });
});
```

### Integration Tests
- Verify database transactions rollback on failure
- Test encryption with actual crypto service
- Validate prescription number uniqueness
- Check notification delivery systems

## Security Considerations
1. **Data Encryption**: Patient data encrypted at rest using AES-256
2. **Access Control**: Only DOCTOR role can create prescriptions
3. **Authorization**: Verified doctor-patient relationship
4. **Audit Trail**: All prescription actions logged
5. **Data Validation**: No SQL injection in encrypted fields
6. **Rate Limiting**: Maximum 50 prescriptions per doctor per day

## Error Handling
```typescript
export enum PrescriptionErrorCode {
  PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND',
  DOCTOR_NOT_FOUND = 'DOCTOR_NOT_FOUND',
  INVALID_PATIENT_RELATIONSHIP = 'INVALID_PATIENT_RELATIONSHIP',
  PRESCRIPTION_LIMIT_EXCEEDED = 'PRESCRIPTION_LIMIT_EXCEEDED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED'
}

export class PrescriptionError extends Error {
  constructor(public code: PrescriptionErrorCode, message: string, public status: number = 400) {
    super(message);
    this.name = 'PrescriptionError';
  }
}
```

## PostgreSQL Functions
```sql
-- Function to generate prescription sequence numbers
CREATE OR REPLACE FUNCTION get_next_prescription_sequence(date_param TEXT)
RETURNS TABLE(next_seq INTEGER) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO prescription_sequences (sequence_date, next_sequence)
  VALUES (date_param, 1)
  ON CONFLICT (sequence_date)
  DO UPDATE SET next_sequence = prescription_sequences.next_sequence + 1
  RETURNING prescription_sequences.next_sequence;
END;
$$ LANGUAGE plpgsql;

-- Table to track prescription number sequences
CREATE TABLE IF NOT EXISTS prescription_sequences (
  sequence_date TEXT PRIMARY KEY,
  next_sequence INTEGER NOT NULL DEFAULT 1
);
```

## Post-Implementation Checklist
- [ ] All unit tests pass (>90% coverage)
- [ ] Encryption service working correctly
- [ ] Prescription number generation unique
- [ ] Patient-doctor relationship verification
- [ ] Notification system integrated
- [ ] Rate limiting applied (50/day per doctor)
- [ ] Error handling comprehensive
- [ ] Performance meets <200ms requirement
- [ ] Data properly sanitized in responses
- [ ] Audit logging functional
- [ ] Expiration date correctly calculated
- [ ] Integration tests with Supabase database
- [ ] Prescription hash generation for tamper detection>