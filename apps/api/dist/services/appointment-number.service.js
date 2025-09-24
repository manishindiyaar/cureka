export class AppointmentNumberService {
    static async generateAppointmentNumber() {
        try {
            const now = new Date();
            const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
            const sequence = ('0000' + (now.getTime() % 10000).toString()).slice(-4);
            return `AID-${datePart}-${sequence}`;
        }
        catch (error) {
            console.error('Generate appointment number error:', error);
            const timestamp = Date.now().toString();
            return `AID-${timestamp.slice(-8)}`;
        }
    }
}
//# sourceMappingURL=appointment-number.service.js.map