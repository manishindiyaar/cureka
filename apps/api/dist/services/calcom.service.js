import axios from 'axios';
export class CalComService {
    apiKey;
    baseURL;
    api;
    constructor(apiKey, baseURL = 'https://api.cal.com/v1') {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
        this.api = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
    }
    async createBooking(bookingRequest) {
        try {
            const startTime = bookingRequest.datetime.toISOString();
            const duration = this.calculateDuration(bookingRequest.type);
            const payload = {
                start: startTime,
                end: this.calculateEndTime(bookingRequest.datetime, duration),
                eventTypeId: bookingRequest.event_type_id || 1,
                responses: {
                    name: 'Appointment',
                    email: 'patient@example.com',
                    location: {
                        value: 'integrations:zoom',
                        optionValue: ''
                    },
                    notes: 'Medical appointment scheduled',
                    customInput: {
                        appointment_number: bookingRequest.appointment_number
                    }
                },
                userIdOrEmail: bookingRequest.doctor_cal_com_id,
                metadata: {
                    appointmentNumber: bookingRequest.appointment_number,
                    doctorId: bookingRequest.doctor_id,
                    patientId: bookingRequest.patient_id
                },
                customInputs: {
                    appointment_number: bookingRequest.appointment_number || '',
                    appointment_type: 'medical',
                    created_at: new Date().toISOString()
                }
            };
            if (bookingRequest.notes) {
                payload.responses.notes = bookingRequest.notes;
                if (payload.customInputs) {
                    payload.customInputs.notes = bookingRequest.notes;
                }
                if (payload.metadata) {
                    payload.metadata.notes = bookingRequest.notes;
                }
            }
            const response = await this.api.post('/bookings', payload);
            if (response.status !== 201) {
                throw new Error(`CalCom API returned status ${response.status}`);
            }
            const bookingData = response.data;
            return {
                booking_id: bookingData.id,
                meeting_url: bookingData.meeting_url,
                ics_url: bookingData.ics_url,
                confirm_link: bookingData.confirm_link,
                reminder: bookingData.remind_later
            };
        }
        catch (error) {
            console.error('CalCom booking creation error:', error);
            throw new Error(`Failed to create Cal.com booking: ${error.message}`);
        }
    }
    async checkDoctorAvailability(doctorId, datetime) {
        try {
            return true;
        }
        catch (error) {
            console.error('Check doctor availability error:', error);
            return false;
        }
    }
    async cancelBooking(bookingId) {
        try {
            const response = await this.api.delete(`/bookings/${bookingId}`);
            return response.status === 200;
        }
        catch (error) {
            console.error('Cancel booking error:', error);
            return false;
        }
    }
    async getBookingDetails(bookingId) {
        try {
            const response = await this.api.get(`/bookings/${bookingId}`);
            return response.data;
        }
        catch (error) {
            console.error('Get booking details error:', error);
            throw new Error(`Failed to get booking details: ${error.message}`);
        }
    }
    calculateDuration(type) {
        const durations = {
            'consultation': 30,
            'followup': 20,
            'emergency': 60,
            'surgery_consultation': 45,
            'telemedicine': 30,
            'prescription_review': 15
        };
        return durations[type] || 30;
    }
    calculateEndTime(startTime, duration) {
        return new Date(startTime.getTime() + duration * 60000).toISOString();
    }
}
export const CAL_COM_CONFIG = {
    baseURL: process.env.CAL_COM_BASE_URL || 'https://api.cal.com/v1',
    apiKey: process.env.CAL_COM_API_KEY || 'your_api_key_here',
    webhookSecret: process.env.CAL_COM_WEBHOOK_SECRET || 'your_webhook_secret',
    defaultEventType: 'medical-consultation',
    businessHours: {
        start: 9,
        end: 18
    }
};
export default CalComService;
//# sourceMappingURL=calcom.service.js.map