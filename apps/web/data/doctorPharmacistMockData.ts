import { UserRole, DoctorSpecialty, AppointmentStatus, PrescriptionStatus, PatientGender, AppointmentType, AlertType, AvailabilityStatus, WeekDay } from '../types/enums';

// Data for global state store
export const mockStore = {
  // Doctor user
  doctorUser: {
    id: "doc-001" as const,
    name: "Dr. Anna Smith" as const,
    email: "anna.smith@cureka.com" as const,
    role: UserRole.DOCTOR,
    hospitalId: "hospital-001" as const,
    specialty: DoctorSpecialty.CARDIOLOGY
  },
  // Pharmacist user
  pharmacistUser: {
    id: "pharm-001" as const,
    name: "Mr. Charles Green" as const,
    email: "charles.green@cureka.com" as const,
    role: UserRole.PHARMACIST,
    hospitalId: "hospital-001" as const,
    storeAddress: "Main Pharmacy, Ground Floor" as const
  }
};

// Data returned by API queries
export const mockQuery = {
  // Doctor's appointments
  doctorAppointments: [
    {
      id: "appt-001" as const,
      patientId: "patient-001" as const,
      patientName: "John Doe" as const,
      appointmentDate: "2024-01-15T10:00:00Z" as const,
      appointmentTime: "10:00 AM" as const,
      status: AppointmentStatus.SCHEDULED,
      type: AppointmentType.CONSULTATION,
      duration: 30,
      notes: "Regular check-up" as const
    },
    {
      id: "appt-002" as const,
      patientId: "patient-002" as const,
      patientName: "Jane Smith" as const,
      appointmentDate: "2024-01-15T14:00:00Z" as const,
      appointmentTime: "2:00 PM" as const,
      status: AppointmentStatus.PENDING,
      type: AppointmentType.FOLLOW_UP,
      duration: 20,
      notes: "Follow-up consultation" as const
    },
    {
      id: "appt-003" as const,
      patientId: "patient-003" as const,
      patientName: "Robert Johnson" as const,
      appointmentDate: "2024-01-15T16:00:00Z" as const,
      appointmentTime: "4:00 PM" as const,
      status: AppointmentStatus.SCHEDULED,
      type: AppointmentType.CHECK_UP,
      duration: 15,
      notes: "Routine check-up" as const
    }
  ],

  // Doctor's patients
  doctorPatients: [
    {
      id: "patient-001" as const,
      name: "John Doe" as const,
      age: 45,
      gender: PatientGender.MALE,
      patientId: "P001" as const,
      medicalHistory: "Hypertension, Diabetes Type 2" as const,
      lastVisit: "2024-01-10T00:00:00Z" as const,
      phone: "+1-555-0123" as const,
      email: "john.doe@email.com" as const,
      address: "123 Main St, City, State 12345" as const
    },
    {
      id: "patient-002" as const,
      name: "Jane Smith" as const,
      age: 32,
      gender: PatientGender.FEMALE,
      patientId: "P002" as const,
      medicalHistory: "Asthma, Allergies" as const,
      lastVisit: "2024-01-08T00:00:00Z" as const,
      phone: "+1-555-0124" as const,
      email: "jane.smith@email.com" as const,
      address: "456 Oak Ave, City, State 12345" as const
    },
    {
      id: "patient-003" as const,
      name: "Robert Johnson" as const,
      age: 28,
      gender: PatientGender.MALE,
      patientId: "P003" as const,
      medicalHistory: "No significant medical history" as const,
      lastVisit: "2024-01-05T00:00:00Z" as const,
      phone: "+1-555-0125" as const,
      email: "robert.johnson@email.com" as const,
      address: "789 Pine St, City, State 12345" as const
    }
  ],

  // Prescription requests for pharmacist
  prescriptionRequests: [
    {
      id: "rx-001" as const,
      patientId: "patient-001" as const,
      patientName: "John Doe" as const,
      doctorId: "doc-001" as const,
      doctorName: "Dr. Anna Smith" as const,
      medication: "Amoxicillin 500mg" as const,
      dosage: "1 capsule every 8 hours" as const,
      duration: "7 days" as const,
      instructions: "Take with food" as const,
      status: PrescriptionStatus.PENDING,
      prescribedDate: "2024-01-15T09:30:00Z" as const,
      priority: "normal" as const
    },
    {
      id: "rx-002" as const,
      patientId: "patient-002" as const,
      patientName: "Jane Smith" as const,
      doctorId: "doc-002" as const,
      doctorName: "Dr. Michael Rodriguez" as const,
      medication: "Lisinopril 10mg" as const,
      dosage: "1 tablet daily" as const,
      duration: "30 days" as const,
      instructions: "Take in the morning" as const,
      status: PrescriptionStatus.PENDING,
      prescribedDate: "2024-01-15T11:15:00Z" as const,
      priority: "urgent" as const
    },
    {
      id: "rx-003" as const,
      patientId: "patient-003" as const,
      patientName: "Robert Johnson" as const,
      doctorId: "doc-001" as const,
      doctorName: "Dr. Anna Smith" as const,
      medication: "Ibuprofen 400mg" as const,
      dosage: "1 tablet as needed" as const,
      duration: "14 days" as const,
      instructions: "Take with food, maximum 3 times daily" as const,
      status: PrescriptionStatus.PENDING,
      prescribedDate: "2024-01-15T13:45:00Z" as const,
      priority: "normal" as const
    }
  ],

  // Past prescription records for pharmacist
  pastPrescriptions: [
    {
      id: "rx-004" as const,
      patientName: "Mary Wilson" as const,
      doctorName: "Dr. Sarah Johnson" as const,
      medication: "Metformin 500mg" as const,
      status: PrescriptionStatus.APPROVED,
      processedDate: "2024-01-14T16:20:00Z" as const,
      processedBy: "Charles Green" as const
    },
    {
      id: "rx-005" as const,
      patientName: "David Brown" as const,
      doctorName: "Dr. Emily Carter" as const,
      medication: "Atorvastatin 20mg" as const,
      status: PrescriptionStatus.REJECTED,
      processedDate: "2024-01-14T14:30:00Z" as const,
      processedBy: "Charles Green" as const,
      rejectionReason: "Patient allergy to statins" as const
    }
  ]
};

// Data passed as props to the root component
export const mockRootProps = {
  doctorDashboardData: {
    todaysAppointments: 3,
    totalPatients: 156,
    pendingRequests: 2,
    completedToday: 1
  },
  pharmacistDashboardData: {
    pendingPrescriptions: 3,
    processedToday: 12,
    totalProcessed: 1247,
    averageProcessingTime: "4.5 minutes" as const
  }
};