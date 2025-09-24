export declare class DatabaseService {
    static healthCheck(): Promise<boolean>;
    static getUserById(id: string): Promise<({
        profile: {
            userId: string;
            fullName: string;
            profileImageUrl: string | null;
        } | null;
        patient: {
            userId: string;
            dateOfBirth: Date | null;
        } | null;
        doctor: {
            userId: string;
            hospitalId: string;
            specialty: string | null;
        } | null;
        pharmacist: {
            userId: string;
            hospitalId: string;
            pharmacyName: string | null;
        } | null;
        hospitalAdmin: {
            userId: string;
            hospitalId: string;
        } | null;
    } & {
        createdAt: Date;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        phone: string | null;
        email: string | null;
        passwordHash: string | null;
        hospitalId: string | null;
        passwordTemp: boolean | null;
        forcePasswordChange: boolean | null;
        lastLogin: Date | null;
        loginAttempts: number | null;
        lockoutUntil: Date | null;
        updatedAt: Date;
    }) | null>;
    static createUser(data: any): Promise<{
        profile: {
            userId: string;
            fullName: string;
            profileImageUrl: string | null;
        } | null;
    } & {
        createdAt: Date;
        id: string;
        role: import(".prisma/client").$Enums.UserRole;
        phone: string | null;
        email: string | null;
        passwordHash: string | null;
        hospitalId: string | null;
        passwordTemp: boolean | null;
        forcePasswordChange: boolean | null;
        lastLogin: Date | null;
        loginAttempts: number | null;
        lockoutUntil: Date | null;
        updatedAt: Date;
    }>;
    static createOtp(number: string, otp: number): Promise<{
        number: string;
        otp: number;
        createdAt: Date;
        id: number;
    }>;
    static findLatestOtp(number: string): Promise<{
        number: string;
        otp: number;
        createdAt: Date;
        id: number;
    } | null>;
    static deleteOtp(number: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    static cleanupExpiredOtps(minutes?: number): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
//# sourceMappingURL=database.service.d.ts.map