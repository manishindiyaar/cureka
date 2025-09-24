import twilio from 'twilio';
let twilioClient = null;
export const initializeTwilioClient = () => {
    if (twilioClient) {
        return twilioClient;
    }
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not configured');
    }
    twilioClient = twilio(accountSid, authToken);
    return twilioClient;
};
export const sendOtpSms = async (phoneNumber, otp) => {
    try {
        const client = initializeTwilioClient();
        const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
        if (!twilioPhoneNumber) {
            throw new Error('Twilio phone number not configured');
        }
        const formattedPhone = phoneNumber.replace(/\s+/g, '');
        const message = await client.messages.create({
            body: `Your Cureka verification code is: ${otp}. This code will expire in 5 minutes.`,
            from: twilioPhoneNumber,
            to: formattedPhone
        });
        console.log(`OTP SMS sent successfully: ${message.sid}`);
    }
    catch (error) {
        console.error('Error sending OTP SMS:', error);
        if (error instanceof Error) {
            if (error.message.includes('21211')) {
                throw new Error('Invalid phone number format');
            }
            else if (error.message.includes('21614')) {
                throw new Error('Unable to send SMS to this phone number');
            }
            else if (error.message.includes('21612')) {
                throw new Error('Invalid sender configuration');
            }
            else if (error.message.includes('21617')) {
                throw new Error('Phone number unreachable');
            }
        }
        throw new Error('Failed to send OTP SMS');
    }
};
export default {
    initializeTwilioClient,
    sendOtpSms
};
//# sourceMappingURL=twilio.service.js.map