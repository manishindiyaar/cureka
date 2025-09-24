export declare class PatientService {
    static findUserByPhone(phoneNumber: string): Promise<{
        createdAt: Date;
        id: string;
        role: import("@prisma/client").$Enums.UserRole;
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
    static createUser(phoneNumber: string): Promise<{
        createdAt: Date;
        id: string;
        role: import("@prisma/client").$Enums.UserRole;
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
    static updateUserLastLogin(userId: string): Promise<{
        createdAt: Date;
        id: string;
        role: import("@prisma/client").$Enums.UserRole;
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
}
//# sourceMappingURL=patient.service.d.ts.map