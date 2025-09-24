import { CreateHospitalDto } from './hospitals.dto.js';
export declare class HospitalsService {
    static generateTemporaryPassword(length?: number): Promise<string>;
    static createHospitalAndAdmin(hospitalData: CreateHospitalDto): Promise<any>;
    static getHospitalById(hospitalId: string): Promise<any>;
}
//# sourceMappingURL=hospitals.service.d.ts.map