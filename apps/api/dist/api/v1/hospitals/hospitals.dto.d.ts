export interface CreateHospitalDto {
    hospital_name: string;
    admin_email: string;
    admin_full_name: string;
}
export interface HospitalResponseDto {
    hospital: {
        id: string;
        name: string;
        created_at: string;
    };
    admin: {
        user_id: string;
        email: string;
        full_name: string;
        role: string;
        hospital_id: string;
        permissions: string[];
        requires_first_login: boolean;
    };
}
//# sourceMappingURL=hospitals.dto.d.ts.map