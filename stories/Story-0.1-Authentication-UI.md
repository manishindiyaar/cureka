## Story 1.3: Authentication UI Implementation

**As a developer**, I want to implement the complete authentication UI flow using the existing OTP backend APIs so that patients can register and log in seamlessly.

### Story Context:
- OTP backend APIs are already implemented and working
- APIs support both `/auth/patient/otp/request` and `/auth/patient/otp/verify`
- Test phone prefix is +91 for Indian numbers
- Default OTP for testing is 1234
- APIs return proper JWT tokens on successful authentication

### Acceptance Criteria:
1. Welcome/Intro Slides (3 screens)
   - Screen 1: Welcome message with Nabha branding
   - Screen 2: Feature showcase (AI Assistant, Appointments, Prescriptions)
   - Screen 3: "Get Started" button

2. Phone Number Input Screen
   - Auto-detect +91 country code
   - Format phone number as user types (e.g., 98765 43210)
   - Disable submit until valid 10 digits entered
   - Show error for invalid numbers
   - Loading indicator during OTP request

3. OTP Verification Screen
   - 4-digit OTP code input
   - Auto-advance to next digit
   - Submit button after all 4 digits
   - Error handling for wrong OTP
   - Auto-submit on 4th digit entry
   - Resend OTP option (30 second cooldown)
   - Countdown timer for OTP expiry

4. Name Collection Screen
   - Only for first-time users
   - First name and last name inputs
   - Optional skip option
   - Minimum name validation

5. State Management
   - Store phone number during flow
   - Store verification token temporarily
   - Clear sensitive data after completion
   - Handle app background state during auth

6. Error Handling
   - Network error handling
   - Invalid phone number errors
   - OTP expiry error
   - Too many attempts error
   - User not found errors

### Technical Implementation:

```tsx
// app/(auth)/index.tsx - Welcome slides
import { View, Image, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeSlides() {
  return (
    <Swiper showsButtons={false} dotColor="gray" activeDotColor={Colors.primary} style={styles.wrapper}>
      <View style={styles.slide}>
        <Image source={require('@/assets/images/welcome1.png')} style={styles.image} />
        <Text style={styles.title}>Welcome to Nabha</Text>
        <Text style={styles.subtitle}>Your AI-powered health companion</Text>
      </View>
      <View style={styles.slide}>
        <Image source={require('@/assets/images/welcome2.png')} style={styles.image} />
        <Text style={styles.title}>Smart AI Assistant</Text>
        <Text style={styles.subtitle}>Get instant health assistance anytime</Text>
      </View>
      <View style={styles.slide}>
        <Image source={require('@/assets/images/welcome3.png')} style={styles.image} />
        <Button title="Get Started" onPress={() => router.push('/phone')} />
      </View>
    </Swiper>
  );
}
```

```tsx
// app/(auth)/phone.tsx - Phone input
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function PhoneInputScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestOTP } = useAuth();

  const handlePhoneSubmit = async () => {
    const cleanedPhone = phone.replace(/\D/g, '');

    if (cleanedPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      await requestOTP('+91' + cleanedPhone);
      router.push({ pathname: '/otp', params: { phone: '+91' + cleanedPhone } });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Phone Number</Text>
      <PhoneNumberInput
        value={phone}
        onChangeText={setPhone}
        placeholder="98765 43210"
        keyboardType="phone-pad"
        maxLength={10}
      />
      <Button
        title={loading ? "Sending OTP..." : "Send OTP"}
        onPress={handlePhoneSubmit}
        disabled={phone.length !== 10}
      />
    </View>
  );
}
```

```tsx
// app/(auth)/otp.tsx - OTP verification
import { useState, useEffect, useRef } from 'react';
import { OtpInput } from '@/components/OtpInput';
import { useAuth } from '@/hooks/useAuth';

export default function OTPScreen() {
  const [otp, setOTP] = useState(new Array(4).fill(''));
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [loading, setLoading] = useState(false);
  const { verifyOTP } = useAuth();
  const { phone } = useLocalSearchParams();

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOTPSubmit = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 4) {
      Alert.alert('Please enter the 4-digit code');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(phone, otpString);

      // Store tokens
      await AsyncStorage.setItem('accessToken', result.access_token);
      await AsyncStorage.setItem('refreshToken', result.refresh_token);

      // Check if new user
      if (result.is_new_user) {
        router.replace('/name');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      Alert.alert('Incorrect Code', 'The code you entered is incorrect or expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>
        Enter the 4-digit code sent to {phone}
      </Text>

      <OtpInput
        value={otp}
        onChange={setOTP}
        length={4}
        onComplete={handleOTPSubmit}
      />

      <View style={styles.actions}>
        <Text style={styles.timer}>
          {timeLeft > 0 ? `Code expires in ${formatTime(timeLeft)}` : 'Code expired'}
        </Text>
        <Text style={[styles.resend, { opacity: timeLeft > 0 ? 0.5 : 1 }]}>
          Resend code
        </Text>
      </View>
    </View>
  );
}
```

```tsx
// hooks/useAuth.ts - Authentication logic
import { useState, useEffect } from 'react';
import { API_BASE } from '@/constants/api';

export function useAuth() {
  const requestOTP = async (phoneNumber: string) => {
    const response = await fetch(`${API_BASE}/auth/patient/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send OTP');
    }
    return response.json();
  };

  const verifyOTP = async (phoneNumber: string, otp: string) => {
    const response = await fetch(`${API_BASE}/auth/patient/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber, otp_code: otp })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid OTP');
    }

    return response.json();
  };

  return { requestOTP, verifyOTP };
}
```

### Test Requirements:

```tsx
// Test validation in app/(auth)/phone.test.tsx
describe('Phone Input Screen', () => {
  it('accepts correct phone number', async () => {
    const { getByPlaceholderText, getByText } = render(<PhoneInputScreen />);

    const input = getByPlaceholderText('98765 43210');
    fireEvent.changeText(input, '9876543210');

    const phoneInput = input._fiber.memoizedProps.value;
    expect(phoneInput).toBe('9876543210');
    expect(getByText('Send OTP')).not.toBeDisabled();
  });

  it('rejects invalid phone numbers', async () => {
    const invalidNumbers = [
      '123456789',      // Too short
      '12345678901',    // Too long
      '123456789@',     // Invalid characters
      ''                // Empty
    ];

    invalidNumbers.forEach(number => {
      const isValid = /^d{10}$/.test(number);
      expect(isValid).toBeFalsy();
    });
  });
});
```

### Notes on Backend Integration:
- OTP endpoint: `/api/v1/auth/patient/otp/request`
- OTP verification: `/api/v1/auth/patient/otp/verify`
- Test phone format: +919876543210
- Test OTP: 1234
- Token expiry: 24 hours
- Refresh token provided for auto-login