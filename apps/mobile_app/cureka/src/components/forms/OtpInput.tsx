import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';

interface OtpInputProps {
  value: string | string[];
  onChange?: (value: string[]) => void;
  length?: number;
  onComplete?: (code: string) => Promise<void>;
}

export function OtpInput({ value, onChange }: OtpInputProps) {
  // Handle change event
  const handleChange = (text: string) => {
    // Update the parent
    if (onChange) {
      onChange(text.split(''));
    }
  };
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={Array.isArray(value) ? value.join('') : value}
        onChangeText={handleChange}
        placeholder="Enter 4-digit code"
        keyboardType="numeric"
        maxLength={4}
        textContentType="oneTimeCode"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 8,
  },
});