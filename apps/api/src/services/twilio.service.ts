import twilio from 'twilio';
import { prisma } from '../lib/prisma.js';

let twilioClient: any = null;

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

export const sendOtpSms = async (phoneNumber: string, otp: string): Promise<void> => {
  try {
    const client = initializeTwilioClient();
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioPhoneNumber) {
      throw new Error('Twilio phone number not configured');
    }

    // Clean phone number (remove + and spaces)
    const formattedPhone = phoneNumber.replace(/\s+/g, '');

    // Send OTP via SMS
    const message = await client.messages.create({
      body: `Your Cureka verification code is: ${otp}. This code will expire in 5 minutes.`,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    console.log(`OTP SMS sent successfully: ${message.sid}`);

    // TODO: Log OTP sending for audit trail
    // This could include:
    // - Phone number (hashed)
    // - Message SID
    // - Timestamp
    // - Status (success/failure)

  } catch (error) {
    console.error('Error sending OTP SMS:', error);

    // Differentiate between different types of errors
    if (error instanceof Error) {
      if (error.message.includes('21211')) {
        // Invalid phone number format
        throw new Error('Invalid phone number format');
      } else if (error.message.includes('21614')) {
        // Cannot send to this phone number
        throw new Error('Unable to send SMS to this phone number');
      } else if (error.message.includes('21612')) {
        // Invalid "From" phone number
        throw new Error('Invalid sender configuration');
      } else if (error.message.includes('21617')) {
        // Phone number unreachable
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