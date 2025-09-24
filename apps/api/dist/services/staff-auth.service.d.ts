import type { User, UserRole } from '@prisma/client';
export interface StaffLoginResult {
    user: {
        user_id: string;
        email: string;
        full_name: string | null;
        role: UserRole;
        hospital_id: string | null;
        hospital_name: string | null;
        permissions: string[];
    };
    access_token: string;
    refresh_token: string;
    token_type: 'Bearer';
    expires_in: number;
    first_login: boolean;
    requires_password_change?: boolean;
}
export declare class StaffAuthService {
    static validateStaffEmail(email: string): Promise<{
        isValid: boolean;
        hospitalName?: string;
        role?: UserRole;
    }>;
    static findStaffUser(email: string): Promise<User | null>;
    static validateStaffCredentials(email: string, password: string): Promise<User | null>;
    static generateTokens(user: User): {
        accessToken: string;
        refreshToken: string;
    };
    static getUserPermissions(role: UserRole): string[];
    static prepareLoginResponse(user: User): Promise<StaffLoginResult>;
}
//# sourceMappingURL=staff-auth.service.d.ts.map