/**
 * Cal.com Integration Service
 *
 * Handles booking creation, availability checking, and calendar synchronization
 * with the Cal.com booking platform
 */

import axios, { AxiosInstance } from 'axios';

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

export class CalComService {
  private api: AxiosInstance;

  constructor(private apiKey: string, private baseURL: string = 'https://api.cal.com/v1') {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Create a new booking in Cal.com
   */
  async createBooking(bookingRequest: CalBookingRequest): Promise<CalBookingResponse> {
    try {
      // Create a proper date format as per Cal.com requirements
      const startTime = bookingRequest.datetime.toISOString();

      // Calculate duration based on type (default 30 minutes)
      const duration = this.calculateDuration(bookingRequest.type);

      const payload = {
        start: startTime,
        end: this.calculateEndTime(bookingRequest.datetime, duration),
        eventTypeId: bookingRequest.event_type_id || 1, // Default event type
        responses: {
          name: 'Appointment',
          email: 'patient@example.com', // In real implementation, would get from profile
          location: {
            value: 'integrations:zoom', // Or 'attendeeInPerson'
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
          (payload.customInputs as any).notes = bookingRequest.notes;
        }
        if (payload.metadata) {
          (payload.metadata as any).notes = bookingRequest.notes;
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

    } catch (error: any) {
      console.error('CalCom booking creation error:', error);
      throw new Error(`Failed to create Cal.com booking: ${error.message}`);
    }
  }

  /**
   * Check doctor availability in Cal.com
   */
  async checkDoctorAvailability(_doctorId: string, _datetime: Date): Promise<boolean> {
    try {
      // For now, return true
      // In production, this would integrate with Cal.com
      return true;
    } catch (error: any) {
      console.error('Check doctor availability error:', error);
      return false;
    }
  }

  /**
   * Cancel a booking in Cal.com
   */
  async cancelBooking(bookingId: string): Promise<boolean> {
    try {
      const response = await this.api.delete(`/bookings/${bookingId}`);
      return response.status === 200;
    } catch (error: any) {
      console.error('Cancel booking error:', error);
      return false;
    }
  }

  /**
   * Get booking details from Cal.com
   */
  async getBookingDetails(bookingId: string): Promise<any> {
    try {
      const response = await this.api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get booking details error:', error);
      throw new Error(`Failed to get booking details: ${error.message}`);
    }
  }

  /**
   * Calculate duration based on appointment type
   */
  private calculateDuration(type: string): number {
    const durations: Record<string, number> = {
      'consultation': 30,
      'followup': 20,
      'emergency': 60,
      'surgery_consultation': 45,
      'telemedicine': 30,
      'prescription_review': 15
    };
    return durations[type] || 30; // Default 30 minutes
  }

  private calculateEndTime(startTime: Date, duration: number): string {
    return new Date(startTime.getTime() + duration * 60000).toISOString();
  }
}

// Environment setup
export const CAL_COM_CONFIG = {
  baseURL: process.env.CAL_COM_BASE_URL || 'https://api.cal.com/v1',
  apiKey: process.env.CAL_COM_API_KEY || 'your_api_key_here',
  webhookSecret: process.env.CAL_COM_WEBHOOK_SECRET || 'your_webhook_secret',
  defaultEventType: 'medical-consultation',
  businessHours: {
    start: 9,  // 9 AM
    end: 18    // 6 PM
  }
};

export default CalComService;