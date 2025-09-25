import { DoctorSpecialty, AppointmentStatus, AlertType, AvailabilityStatus, PrescriptionStatus, PatientGender, AppointmentType } from '../types/enums';

export const formatSpecialty = (specialty: DoctorSpecialty): string => {
  return specialty;
};

export const formatAppointmentStatus = (status: AppointmentStatus): string => {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return 'Scheduled';
    case AppointmentStatus.PENDING:
      return 'Pending Approval';
    case AppointmentStatus.COMPLETED:
      return 'Completed';
    case AppointmentStatus.CANCELLED:
      return 'Cancelled';
    case AppointmentStatus.RESCHEDULED:
      return 'Rescheduled';
    default:
      return status;
  }
};

export const formatAvailabilityStatus = (status: AvailabilityStatus): string => {
  switch (status) {
    case AvailabilityStatus.AVAILABLE:
      return 'Available';
    case AvailabilityStatus.BUSY:
      return 'Busy';
    case AvailabilityStatus.OFFLINE:
      return 'Offline';
    case AvailabilityStatus.ON_LEAVE:
      return 'On Leave';
    default:
      return status;
  }
};

export const formatAlertType = (type: AlertType): string => {
  switch (type) {
    case AlertType.URGENT:
      return 'Urgent';
    case AlertType.WARNING:
      return 'Warning';
    case AlertType.INFO:
      return 'Information';
    case AlertType.SUCCESS:
      return 'Success';
    default:
      return type;
  }
};

export const formatDateTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatPrescriptionStatus = (status: PrescriptionStatus): string => {
  switch (status) {
    case PrescriptionStatus.PENDING:
      return 'Pending';
    case PrescriptionStatus.APPROVED:
      return 'Approved';
    case PrescriptionStatus.REJECTED:
      return 'Rejected';
    case PrescriptionStatus.DISPENSED:
      return 'Dispensed';
    default:
      return status;
  }
};

export const formatPatientGender = (gender: PatientGender): string => {
  switch (gender) {
    case PatientGender.MALE:
      return 'Male';
    case PatientGender.FEMALE:
      return 'Female';
    case PatientGender.OTHER:
      return 'Other';
    default:
      return gender;
  }
};

export const formatAppointmentType = (type: AppointmentType): string => {
  switch (type) {
    case AppointmentType.CONSULTATION:
      return 'Consultation';
    case AppointmentType.FOLLOW_UP:
      return 'Follow-up';
    case AppointmentType.CHECK_UP:
      return 'Check-up';
    case AppointmentType.EMERGENCY:
      return 'Emergency';
    case AppointmentType.ROUTINE:
      return 'Routine';
    default:
      return type;
  }
};