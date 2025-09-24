import { Request, Response } from 'express';
export declare class HospitalsDashboardController {
    static getDashboardOverview(req: Request, res: Response): Promise<Response>;
    static getStaffList(req: Request, res: Response): Promise<Response>;
    static addDoctor(req: Request, res: Response): Promise<Response>;
    private static getUserHospitalId;
    private static generateTemporaryPassword;
}
//# sourceMappingURL=hospitals-dashboard.controller.d.ts.map