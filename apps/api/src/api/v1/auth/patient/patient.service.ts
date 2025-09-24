import { prisma } from '../../../../lib/prisma.js';
import type { User } from '@prisma/client';
import crypto from 'crypto';

export class PatientService {
  static async findUserByPhone(phoneNumber: string) {
    return await prisma.user.findUnique({
      where: {
        phone: phoneNumber
      }
    });
  }

  static async createUser(phoneNumber: string) {
    return await prisma.user.create({
      data: {
        id: crypto.randomUUID(), // Required UUID for user
        phone: phoneNumber,
        role: 'PATIENT',
        // createdAt and updatedAt are handled by @default(now()) in schema
      }
    }).then(user => user as User);
  }

  static async updateUserLastLogin(userId: string) {
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