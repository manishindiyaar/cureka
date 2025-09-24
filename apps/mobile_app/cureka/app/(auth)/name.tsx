import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/colors';
import { NameInput } from '@/components/forms/NameInput';

export default function NameInputScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNameSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Please enter a valid name (at least 2 characters)');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would save the name to your backend here
      // For now, we'll just go to the main app
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Error', 'Failed to save name');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Tell us your name</Text>
        <Text style={styles.subtitle}>
          This helps us personalize your experience
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <NameInput
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
          autoFocus={true}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, (!name || name.length < 2) && styles.buttonDisabled]}
          onPress={handleNameSubmit}
          disabled={!name || name.length < 2}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
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
  skipButton: {
    marginTop: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: Colors.gray[600],
  },
});