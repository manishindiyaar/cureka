import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';

const SALT_ROUNDS = 10;

export class PasswordService {
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}