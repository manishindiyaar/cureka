export declare enum AppointmentStatus {
    SCHEDULED = "SCHEDULED",
    CONFIRMED = "CONFIRMED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    NO_SHOW = "NO_SHOW",
    RESCHEDULED = "RESCHEDULED"
}
export declare enum AppointmentType {
    CONSULTATION = "consultation",
    FOLLOWUP = "followup",
    EMERGENCY = "emergency",
    SURGERY_CONSULTATION = "surgery_consultation",
    TELEMEDICINE = "telemedicine",
    PRESCRIPTION_REVIEW = "prescription_review",
    FOLLOW_UP_SURGERY = "follow_up_surgery"
}
export declare const APPOINTMENT_DURATIONS: Record<AppointmentType, number>;
export interface CreateAppointmentDto {
    doctor_id: string;
    appointment_datetime: string;
    appointment_type?: AppointmentType;
    notes?: string;
}
export interface AppointmentResponse {
    appointment_id: string;
    cal_booking_id: string;
    doctor: {
        doctor_id: string;
        name: string;
        specialty: string;
    };
    patient: {
        patient_id: string;
        name: string;
    };
    appointment_details: {
        datetime: string;
        duration_minutes: number;
        appointment_type: AppointmentType;
        status: AppointmentStatus;
        appointment_number: string;
    };
    meeting_links?: {
        video_conference_url?: string;
        cal_event_link?: string;
    };
}
export interface CalBookingRequest {
    type: string;
    datetime: Date;
    event_type_id?: number;
    doctor_cal_com_id: string;
    appointment_number: string;
    doctor_id: string;
    patient_id: string;
    notes?: string;
}
//# sourceMappingURL=appointments.dto.d.ts.map