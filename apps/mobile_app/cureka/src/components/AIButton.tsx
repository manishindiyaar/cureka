import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import * as SecureStore from 'expo-secure-store';

interface AIButtonProps {
  onPress?: () => void;
  title?: string;
  size?: 'large' | 'medium' | 'small';
  style?: any;
}

export default function AIButton({
  onPress,
  title = 'Talk to AI Assistant',
  size = 'large',
  style,
}: AIButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const defaultPress = async () => {
    try {
      setIsLoading(true);

      // Check authentication
      const authToken = await SecureStore.getItemAsync('accessToken');
      if (!authToken) {
        alert('Please login to use AI assistant');
        return;
      }

      // Navigate to voice chat with authentication check
      router.push('/(chat)/chat');

    } catch (error) {
      console.error('Error starting AI session:', error);
      alert('Failed to start AI session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const buttonSizeStyle = {
    paddingVertical: size === 'large' ? 20 : size === 'medium' ? 16 : 12,
    paddingHorizontal: size === 'large' ? 32 : size === 'medium' ? 24 : 16,
    minWidth: size === 'large' ? 250 : size === 'medium' ? 200 : 150,
  };

  const iconSize = size === 'large' ? 48 : size === 'medium' ? 32 : 24;

  return (
    <TouchableOpacity
      style={[styles.button, buttonSizeStyle, style]}
      onPress={onPress || defaultPress}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint="Double tap to start a conversation with our AI assistant"
      accessible={true}
    >
      <View style={styles.buttonContent}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" style={styles.loadingIndicator} />
        ) : (
          <FontAwesome name="microphone" size={iconSize} color="#ffffff" style={styles.icon} />
        )}
        <Text style={[styles.buttonText, { fontSize: size === 'large' ? 18 : 16 }]}>
          {isLoading ? 'Connecting...' : title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    elevation: 5,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignSelf: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 12,
  },
  loadingIndicator: {
    marginRight: 12,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
});