import { UserRole, DoctorSpecialty, AppointmentStatus, AlertType, AvailabilityStatus, WeekDay } from '../types/enums';

// Data for global state store
export const mockStore = {
  currentUser: {
    id: "admin-001" as const,
    name: "Dr. Sarah Johnson" as const,
    email: "sarah.johnson@cureka.com" as const,
    role: UserRole.ADMIN,
    hospitalId: "hospital-001" as const
  },
  isAuthenticated: true,
  dashboardStats: {
    totalPatients: 1247,
    activeDoctors: 34,
    todaysAppointments: 89,
    pendingPrescriptions: 15
  }
};

// Data returned by API queries
export const mockQuery = {
  doctors: [
    {
      id: "doc-001" as const,
      name: "Dr. Emily Carter" as const,
      email: "emily.carter@cureka.com" as const,
      specialty: DoctorSpecialty.CARDIOLOGY,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      joiningDate: "2023-01-15T00:00:00Z" as const,
      weeklyAvailability: {
        [WeekDay.MONDAY]: { start: "09:00" as const, end: "17:00" as const },
        [WeekDay.TUESDAY]: { start: "09:00" as const, end: "17:00" as const },
        [WeekDay.WEDNESDAY]: { start: "09:00" as const, end: "17:00" as const },
        [WeekDay.THURSDAY]: { start: "09:00" as const, end: "17:00" as const },
        [WeekDay.FRIDAY]: { start: "09:00" as const, end: "13:00" as const },
        [WeekDay.SATURDAY]: { start: "09:00" as const, end: "13:00" as const },
        [WeekDay.SUNDAY]: { start: "09:00" as const, end: "13:00" as const }
      }
    },
    {
      id: "doc-002" as const,
      name: "Dr. Michael Rodriguez" as const,
      email: "michael.rodriguez@cureka.com" as const,
      specialty: DoctorSpecialty.NEUROLOGY,
      availabilityStatus: AvailabilityStatus.BUSY,
      joiningDate: "2022-08-20T00:00:00Z" as const,
      weeklyAvailability: {
        [WeekDay.MONDAY]: { start: "08:00" as const, end: "16:00" as const },
        [WeekDay.TUESDAY]: { start: "08:00" as const, end: "16:00" as const },
        [WeekDay.WEDNESDAY]: { start: "08:00" as const, end: "16:00" as const },
        [WeekDay.THURSDAY]: { start: "08:00" as const, end: "16:00" as const },
        [WeekDay.FRIDAY]: { start: "08:00" as const, end: "16:00" as const },
        [WeekDay.SATURDAY]: { start: "08:00" as const, end: "12:00" as const },
        [WeekDay.SUNDAY]: { start: "08:00" as const, end: "12:00" as const }
      }
    }
  ],
  pharmacists: [
    {
      id: "pharm-001" as const,
      name: "Mr. Rachit Kothadia" as const,
      email: "rachit.kothadia@cureka.com" as const,
      qualifications: "PharmD, MBA" as const,
      joiningDate: "2022-03-10T00:00:00Z" as const,
      storeAddress: "Main Pharmacy, Ground Floor" as const,
      availabilityStatus: AvailabilityStatus.AVAILABLE
    },
    {
      id: "pharm-002" as const,
      name: "Mr. Omesh Kshatriya" as const,
      email: "omesh.kshatriya@cureka.com" as const,
      qualifications: "PharmD" as const,
      joiningDate: "2023-01-05T00:00:00Z" as const,
      storeAddress: "Emergency Pharmacy, 2nd Floor" as const,
      availabilityStatus: AvailabilityStatus.AVAILABLE
    },
    {
      id: "pharm-003" as const,
      name: "Mr. Brijesh Kurkure" as const,
      email: "brijesh.kurkure@cureka.com" as const,
      qualifications: "PharmD, MSc" as const,
      joiningDate: "2021-11-15T00:00:00Z" as const,
      storeAddress: "Outpatient Pharmacy, 1st Floor" as const,
      availabilityStatus: AvailabilityStatus.ON_LEAVE
    }
  ],
  realtimeAlerts: [
    {
      id: "alert-001" as const,
      type: AlertType.URGENT,
      message: "Urgent Patient: John Doe requires immediate attention" as const,
      timestamp: "2024-01-15T14:30:00Z" as const,
      patientId: "patient-001" as const
    },
    {
      id: "alert-002" as const,
      type: AlertType.WARNING,
      message: "15 appointments pending approval" as const,
      timestamp: "2024-01-15T14:25:00Z" as const
    }
  ],
  appointments: [
    {
      id: "appt-001" as const,
      patientName: "John Doe" as const,
      doctorId: "doc-001" as const,
      doctorName: "Dr. Emily Carter" as const,
      appointmentDate: "2024-01-15T10:00:00Z" as const,
      status: AppointmentStatus.SCHEDULED,
      type: "Consultation" as const
    },
    {
      id: "appt-002" as const,
      patientName: "Jane Smith" as const,
      doctorId: "doc-002" as const,
      doctorName: "Dr. Michael Rodriguez" as const,
      appointmentDate: "2024-01-15T14:00:00Z" as const,
      status: AppointmentStatus.PENDING,
      type: "Follow-up" as const
    }
  ]
};

// Data passed as props to the root component
export const mockRootProps = {
  initialDashboardData: {
    totalPatients: 1247,
    activeDoctors: 34,
    todaysAppointments: 89,
    pendingPrescriptions: 15
  }
};