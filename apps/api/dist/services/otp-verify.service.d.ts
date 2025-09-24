export declare const validatePhoneNumber: (phone: string) => boolean;
export declare const validateOTP: (otp: string) => boolean;
export declare class OtpVerificationService {
    static verifyOtp(phoneNumber: string, otpCode: string): Promise<boolean>;
}
export declare class TokenService {
    static generateTokens(user: any): {
        accessToken: string;
        refreshToken: string;
    };
}
export declare class PatientAuthService {
    static createUserIfNotExists(phoneNumber: string): Promise<any>;
}
//# sourceMappingURL=otp-verify.service.d.ts.map