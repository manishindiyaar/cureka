import { prisma } from '../lib/prisma.js';
export class DatabaseService {
    static async healthCheck() {
        try {
            await prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
    static async getUserById(id) {
        return prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
                patient: true,
                doctor: true,
                pharmacist: true,
                hospitalAdmin: true
            }
        });
    }
    static async createUser(data) {
        return prisma.user.create({
            data,
            include: {
                profile: true
            }
        });
    }
    static async createOtp(number, otp) {
        await prisma.otp.deleteMany({
            where: { number }
        });
        return prisma.otp.create({
            data: { number, otp }
        });
    }
    static async findLatestOtp(number) {
        return prisma.otp.findFirst({
            where: { number },
            orderBy: { createdAt: 'desc' }
        });
    }
    static async deleteOtp(number) {
        return prisma.otp.deleteMany({
            where: { number }
        });
    }
    static async cleanupExpiredOtps(minutes = 5) {
        const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
        return prisma.otp.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffTime
                }
            }
        });
    }
}
prisma.$connect().catch(console.error);
//# sourceMappingURL=database.service.js.map