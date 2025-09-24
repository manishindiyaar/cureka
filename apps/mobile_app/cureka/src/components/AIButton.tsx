import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

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

  const defaultPress = () => {
    // Navigate to chat interface or directly start AI session
    router.push('/(chat)/chat' as any);
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
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint="Double tap to start a conversation with our AI assistant"
      accessible={true}
    >
      <View style={styles.buttonContent}>
        <FontAwesome name="comments" size={iconSize} color="#ffffff" style={styles.icon} />
        <Text style={[styles.buttonText, { fontSize: size === 'large' ? 18 : 16 }]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1f345a',
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000000',
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
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
});