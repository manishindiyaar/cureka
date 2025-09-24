import { Request, Response, NextFunction } from 'express';
export declare const authenticateJWT: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorizeHospitalAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorizeDoctor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorizePharmacist: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorizePatient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorizeAppointmentOwner: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map