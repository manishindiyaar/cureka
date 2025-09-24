import { validationResult } from 'express-validator';
import { OtpVerificationService, TokenService, validatePhoneNumber, validateOTP } from '../../../../services/otp-verify.service.js';
import { PatientService } from './patient.service.js';
export class OtpVerifyController {
    static async verifyOtp(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid phone number or OTP format',
                    errors: errors.array()
                });
            }
            const { phone_number, otp_code } = req.body;
            if (!validatePhoneNumber(phone_number) || !validateOTP(otp_code)) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid phone number or OTP format'
                });
            }
            await OtpVerificationService.verifyOtp(phone_number, otp_code);
            let user = await PatientService.findUserByPhone(phone_number);
            if (!user) {
                user = await PatientService.createUser(phone_number);
            }
            else {
                await PatientService.updateUserLastLogin(user.id);
            }
            if (!user) {
                throw new Error('Failed to create or retrieve user');
            }
            const { accessToken, refreshToken } = TokenService.generateTokens(user);
            return res.status(200).json({
                success: true,
                data: {
                    user: {
                        user_id: user.id,
                        phone_number: user.phone,
                        full_name: null
                    },
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    token_type: 'Bearer',
                    expires_in: 86400
                }
            });
        }
        catch (error) {
            if (error.message === 'Invalid or expired OTP' || error.message === 'OTP has expired' || error.message === 'Invalid OTP') {
                return res.status(400).json({
                    success: false,
                    code: 'INVALID_OTP',
                    message: error.message
                });
            }
            console.error('Error in verifyOtp:', error);
            return res.status(500).json({
                success: false,
                code: 'INTERNAL_ERROR',
                message: 'Failed to verify OTP'
            });
        }
    }
}
//# sourceMappingURL=otp-verify.controller.js.map