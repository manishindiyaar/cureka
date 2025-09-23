import { prisma } from '../lib/prisma.js'

export class DatabaseService {
  static async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        patient: true,
        doctor: true,
        pharmacist: true,
        hospitalAdmin: true
      }
    })
  }

  static async createUser(data: any) {
    return prisma.user.create({
      data,
      include: {
        profile: true
      }
    })
  }

  // Add OTP-related methods
  static async createOtp(number: string, otp: number) {
    // Delete any existing OTPs for this number first
    await prisma.otp.deleteMany({
      where: { number }
    });

    // Create new OTP
    return prisma.otp.create({
      data: { number, otp }
    });
  }

  static async findLatestOtp(number: string) {
    return prisma.otp.findFirst({
      where: { number },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async deleteOtp(number: string) {
    return prisma.otp.deleteMany({
      where: { number }
    });
  }

  static async cleanupExpiredOtps(minutes: number = 5) {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return prisma.otp.deleteMany({
      where: {
        createdAt: {
          lt: cutoffTime
        }
      }
    });
  }

  // Add other database operations as needed
}

// Ensure Prisma Client is connected
prisma.$connect().catch(console.error)