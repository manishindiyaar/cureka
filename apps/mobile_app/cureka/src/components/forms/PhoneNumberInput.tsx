import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';

interface PhoneNumberInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function PhoneNumberInput({ value, onChangeText, placeholder }: PhoneNumberInputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || "Enter phone number"}
        keyboardType="phone-pad"
        maxLength={15}
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
  },
});