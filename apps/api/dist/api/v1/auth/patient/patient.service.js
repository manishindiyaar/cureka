import { prisma } from '../../../../lib/prisma.js';
export class PatientService {
    static async findUserByPhone(phoneNumber) {
        return await prisma.user.findUnique({
            where: {
                phone: phoneNumber
            }
        });
    }
    static async createUser(phoneNumber) {
        return await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                phone: phoneNumber,
                role: 'PATIENT',
            }
        }).then(user => user);
    }
    static async updateUserLastLogin(userId) {
        return await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                updatedAt: new Date()
            }
        });
    }
}
//# sourceMappingURL=patient.service.js.map