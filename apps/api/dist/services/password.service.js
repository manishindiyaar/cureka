import bcrypt from 'bcryptjs';
const SALT_ROUNDS = 10;
export class PasswordService {
    static async hashPassword(password) {
        return await bcrypt.hash(password, SALT_ROUNDS);
    }
    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
}
//# sourceMappingURL=password.service.js.map