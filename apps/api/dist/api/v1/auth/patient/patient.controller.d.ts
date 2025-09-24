import { Request, Response } from 'express';
export declare const otpRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const requestOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const verifyOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=patient.controller.d.ts.map