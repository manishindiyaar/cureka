/**
 * Appointment Number Service
 *
 * Generates unique appointment numbers in format: AID-YYYYMMDD-XXXX
 */

export class AppointmentNumberService {
  /**
   * Generate unique appointment number
   * Format: AID-YYYYMMDD-XXXX (where XXXX is a 4-digit sequence number)
   */
  static async generateAppointmentNumber(): Promise<string> {
    try {
      const now = new Date();
      const datePart = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

      // For now, use timestamp for uniqueness
      // In production, this would query a sequence in the database
      const sequence = ('0000' + (now.getTime() % 10000).toString()).slice(-4);

      return `AID-${datePart}-${sequence}`;
    } catch (error: any) {
      console.error('Generate appointment number error:', error);
      // Fallback to timestamp
      const timestamp = Date.now().toString();
      return `AID-${timestamp.slice(-8)}`;
    }
  }
}