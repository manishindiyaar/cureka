import { CreateDoctorDto } from './doctors.dto.js';
export declare class DoctorsService {
    static generateTemporaryPassword(length?: number): Promise<string>;
    static createDoctor(hospitalAdminId: string, doctorData: Omit<CreateDoctorDto, 'password'>): Promise<any>;
    static getDoctorById(doctorId: string): Promise<any>;
}
//# sourceMappingURL=doctors.service.d.ts.map