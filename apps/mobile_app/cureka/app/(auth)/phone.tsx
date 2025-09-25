import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/colors';
import { PhoneNumberInput } from '@/components/forms/PhoneNumberInput';
import { useAuth } from '@/hooks/useAuth';

export default function PhoneInputScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const router = useRouter();
  const { requestOTP, checkAuthStatus } = useAuth();

  // Check if user is already authenticated when screen loads
  useEffect(() => {
    const verifyAuthStatus = async () => {
      const isAuthenticated = await checkAuthStatus();
      if (isAuthenticated) {
        // Already authenticated, redirect to tabs
        router.replace('/(tabs)');
        return;
      }
      // Not authenticated, show phone screen
      setIsAuthenticating(false);
    };
    verifyAuthStatus();
  }, [checkAuthStatus]);

  const handlePhoneSubmit = async () => {
    const cleanedPhone = phone.replace(/\D/g, '');

    if (cleanedPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    const fullPhoneNumber = '+91' + cleanedPhone;
    console.log('Sending OTP to:', fullPhoneNumber); // Debug log

    setLoading(true);
    try {
      await requestOTP(fullPhoneNumber);
      router.push({ pathname: '/(auth)/otp', params: { phone: fullPhoneNumber } });
    } catch (error: any) {
      console.error('OTP Request Error:', error);
      console.error('Error details:', error.message, error.stack);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Loading indicator while checking auth */}
      {isAuthenticating && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      )}

      {!isAuthenticating && (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Enter Your Phone Number</Text>
            <Text style={styles.subtitle}>
              We'll send you an OTP to verify your number
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <PhoneNumberInput
              value={phone}
              onChangeText={setPhone}
              placeholder="98765 43210"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                (!phone || phone.length !== 10 || loading) && styles.buttonDisabled
              ]}
              onPress={handlePhoneSubmit}
              disabled={!phone || phone.length !== 10 || loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.termsText}>
              By continuing, you accept our
            </Text>
            <View style={styles.termsLinks}>
              <TouchableOpacity>
                <Text style={styles.linkText}>Terms of Use</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}> and </Text>
              <TouchableOpacity>
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
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
    marginBottom: 40,
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
  inputContainer: {
    marginVertical: 20,
  },
  buttonContainer: {
    marginTop: 30,
  },
  button: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  termsLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 14,
    color: Colors.primaryDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray[700],
  },
});