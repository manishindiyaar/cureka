import { UserRole, DoctorSpecialty, AppointmentStatus, AlertType, AvailabilityStatus, WeekDay, PrescriptionStatus, PatientGender, AppointmentType } from './enums';

export { AlertType, PrescriptionStatus, PatientGender, AppointmentType } from './enums';

// Props types (data passed to components)
export interface DashboardProps {
  initialStats: {
    totalPatients: number;
    activeDoctors: number;
    todaysAppointments: number;
    pendingPrescriptions: number;
  };
}

export interface DoctorFormProps {
  doctor?: Doctor;
  onSubmit: (data: DoctorFormData) => void;
  onCancel: () => void;
}

export interface PharmacistCardProps {
  pharmacist: Pharmacist;
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface AlertPanelProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
}

// Store types (global state data)
export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

export interface DashboardState {
  stats: DashboardStats;
  alerts: Alert[];
  isLoading: boolean;
}

export interface StaffState {
  doctors: Doctor[];
  pharmacists: Pharmacist[];
  isLoading: boolean;
}

// Query types (API response data)
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hospitalId: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: DoctorSpecialty;
  availabilityStatus: AvailabilityStatus;
  joiningDate: string;
  weeklyAvailability: Record<WeekDay, { start: string; end: string }>;
}

export interface Pharmacist {
  id: string;
  name: string;
  email: string;
  qualifications: string;
  joiningDate: string;
  storeAddress: string;
  availabilityStatus: AvailabilityStatus;
}

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  timestamp: string;
  patientId?: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  status: AppointmentStatus;
  type: string;
}

export interface DashboardStats {
  totalPatients: number;
  activeDoctors: number;
  todaysAppointments: number;
  pendingPrescriptions: number;
}

export interface DoctorFormData {
  name: string;
  email: string;
  specialty: DoctorSpecialty;
  weeklyAvailability: Record<WeekDay, { start: string; end: string }>;
}

// New interfaces for Doctor and Pharmacist portals
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: PatientGender;
  patientId: string;
  medicalHistory: string;
  lastVisit: string;
  phone: string;
  email: string;
  address: string;
}

export interface DoctorAppointment {
  id: string;
  patientId: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  type: AppointmentType;
  duration: number;
  notes: string;
}

export interface PrescriptionRequest {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  medication: string;
  dosage: string;
  duration: string;
  instructions: string;
  status: PrescriptionStatus;
  prescribedDate: string;
  priority: string;
}

export interface ProcessedPrescription {
  id: string;
  patientName: string;
  doctorName: string;
  medication: string;
  status: PrescriptionStatus;
  processedDate: string;
  processedBy: string;
  rejectionReason?: string;
}

export interface DoctorStats {
  todaysAppointments: number;
  totalPatients: number;
  pendingRequests: number;
  completedToday: number;
}

export interface PharmacistStats {
  pendingPrescriptions: number;
  processedToday: number;
  totalProcessed: number;
  averageProcessingTime: string;
}

export interface PharmacistProfile {
  id: string;
  name: string;
  email: string;
  qualifications: string;
  storeAddress: string;
  phone?: string;
  licenseNumber?: string;
}

// Component Props
export interface AppointmentCardProps {
  appointment: DoctorAppointment;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onReschedule?: (id: string) => void;
}

export interface PatientCardProps {
  patient: Patient;
  onViewDetails: (id: string) => void;
  onEdit?: (id: string) => void;
}

export interface PrescriptionCardProps {
  prescription: PrescriptionRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}