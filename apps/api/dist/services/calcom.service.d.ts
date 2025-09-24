interface CalBookingRequest {
    type: string;
    datetime: Date;
    event_type_id?: number;
    doctor_cal_com_id: string;
    appointment_number: string;
    doctor_id: string;
    patient_id: string;
    notes?: string;
}
interface CalBookingResponse {
    booking_id: string;
    meeting_url?: string;
    ics_url?: string;
    confirm_link?: string;
    reminder?: boolean;
}
export declare class CalComService {
    private apiKey;
    private baseURL;
    private api;
    constructor(apiKey: string, baseURL?: string);
    createBooking(bookingRequest: CalBookingRequest): Promise<CalBookingResponse>;
    checkDoctorAvailability(_doctorId: string, _datetime: Date): Promise<boolean>;
    cancelBooking(bookingId: string): Promise<boolean>;
    getBookingDetails(bookingId: string): Promise<any>;
    private calculateDuration;
    private calculateEndTime;
}
export declare const CAL_COM_CONFIG: {
    baseURL: string;
    apiKey: string;
    webhookSecret: string;
    defaultEventType: string;
    businessHours: {
        start: number;
        end: number;
    };
};
export default CalComService;
//# sourceMappingURL=calcom.service.d.ts.map