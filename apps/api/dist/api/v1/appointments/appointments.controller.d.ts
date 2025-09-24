import { Request, Response } from 'express';
export declare class AppointmentsController {
    static createAppointment(req: Request, res: Response): Promise<Response>;
    static getAvailableSlots(req: Request, res: Response): Promise<Response>;
    static getAppointment(req: Request, res: Response): Promise<Response>;
    static updateAppointmentStatus(req: Request, res: Response): Promise<Response>;
    static cancelAppointment(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=appointments.controller.d.ts.map