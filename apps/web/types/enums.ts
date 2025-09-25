// Enums for the Hospital Admin Dashboard

export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor', 
  PHARMACIST = 'pharmacist'
}

export enum DoctorSpecialty {
  CARDIOLOGY = 'Cardiology',
  NEUROLOGY = 'Neurology',
  ORTHOPEDICS = 'Orthopedics',
  PEDIATRICS = 'Pediatrics',
  DERMATOLOGY = 'Dermatology',
  GENERAL_MEDICINE = 'General Medicine',
  SURGERY = 'Surgery',
  PSYCHIATRY = 'Psychiatry'
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled'
}

export enum AlertType {
  URGENT = 'urgent',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success'
}

export enum AvailabilityStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ON_LEAVE = 'on_leave'
}

export enum WeekDay {
  MONDAY = 'monday',
  TUESDAY = 'tuesday', 
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

export enum PrescriptionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISPENSED = 'dispensed'
}

export enum PatientGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export enum AppointmentType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  CHECK_UP = 'check_up',
  EMERGENCY = 'emergency',
  ROUTINE = 'routine'
}