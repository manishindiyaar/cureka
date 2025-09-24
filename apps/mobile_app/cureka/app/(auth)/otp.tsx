import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/colors';
import { OtpInput } from '@/components/forms/OtpInput';
import { useAuth } from '@/hooks/useAuth';
import { saveSecure } from '@/lib/storage';

export default function OTPScreen() {
  const [otp, setOtp] = useState<string[]>([...Array(4)].map(() => ''));
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOTP } = useAuth();

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleOTPComplete = async (code: string) => {
    if (code.length !== 4) return;

    setError('');
    setLoading(true);

    try {
      const result = await verifyOTP(phone, code);

      // Store tokens
      await saveSecure('accessToken', result.tokens.accessToken);
      await saveSecure('refreshToken', result.tokens.refreshToken);

      // Check if new user
      if (result.isNewUser) {
        router.replace('/(auth)/name');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid code');
      Alert.alert('Incorrect Code', 'The code you entered is incorrect or expired');
      setOtp([...Array(4)].map(() => ''));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    Alert.alert('Resend Code', 'A new OTP will be sent to your number');
    setTimeLeft(300);
    setOtp([...Array(4)].map(() => ''));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit code sent to {phone}
        </Text>
      </View>

      <View style={styles.content}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <OtpInput
          value={otp}
          onChange={setOtp}
          length={4}
          onComplete={handleOTPComplete}
        />

        <View style={styles.actions}>
          {timeLeft > 0 ? (
            <Text style={styles.timer}>
              Code expires in {formatTime(timeLeft)}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={styles.resendText}>Resend code</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleOTPComplete(otp.join(''))}
            disabled={otp.join('').length !== 4 || loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 60,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray[600],
    lineHeight: 24,
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  errorText: {
    color: Colors.primaryLight,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: {
    marginTop: 20,
    alignItems: 'center',
  },
  timer: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  resendText: {
    fontSize: 16,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});