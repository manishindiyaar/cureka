import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { voiceService } from '@/services/vapi.service';
import { webSocketService } from '@/services/websocket.service';
import * as SecureStore from 'expo-secure-store';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isVoice?: boolean;
}

interface VoiceEvent {
  type: 'transcript' | 'bot-speaking' | 'user-speaking' | 'connection-status';
  data: any;
  timestamp: string;
}

export default function VoiceChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [typingMessage, setTypingMessage] = useState<string>('');
  const [assistantId] = useState<string>(() => {
    const assistantIdParam = params.assistantId as string | undefined;
    const envAssistantId = process.env.EXPO_PUBLIC_VAPI_ASSISTANT_ID;
    return assistantIdParam || envAssistantId || '';
  });

  const sessionId = useRef<string>('');
  const patientId = useRef<string>('');
  const listenerIdRef = useRef<string>('');

  /**
   * Initialize voice session on component mount
   */
  useEffect(() => {
    initializeVoiceSession();

    return () => {
      // Cleanup on unmount
      if (listenerIdRef.current) {
        voiceService.stopVoiceSession(listenerIdRef.current);
      }
      if (webSocketService.isConnected()) {
        webSocketService.disconnect();
      }
    };
  }, []);

  /**
   * Handle new voice events
   */
  const handleVoiceEvent = useCallback((event: VoiceEvent) => {
    console.log('Voice event received:', event);

    switch (event.type) {
      case 'connection-status':
        handleConnectionStatus(event.data.status);
        break;

      case 'transcript':
        handleTranscript(event.data);
        break;

      case 'bot-speaking':
        setTypingMessage('AI is thinking...');
        break;

      case 'user-speaking':
        // Update UI to show user is speaking
        setIsListening(true);
        break;
    }
  }, []);

  /**
   * Handle connection status changes
   */
  const handleConnectionStatus = (status: string) => {
    setConnectionStatus(status);

    switch (status) {
      case 'connecting':
        setIsConnecting(true);
        setIsConnected(false);
        break;

      case 'connected':
        setIsConnecting(false);
        setIsConnected(true);
        // Add system message
        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Connected! You can start speaking now.',
          timestamp: new Date().toISOString(),
          isVoice: false
        });
        break;

      case 'disconnected':
        setIsConnecting(false);
        setIsConnected(false);
        setIsListening(false);
        break;

      case 'error':
        setIsConnecting(false);
        setIsConnected(false);
        Alert.alert('Connection Error', 'Failed to connect to voice service. Please try again.');
        break;
    }
  };

  /**
   * Handle transcript messages
   */
  const handleTranscript = (transcriptData: any) => {
    setTypingMessage('');
    setIsListening(false);

    if (transcriptData.role === 'assistant' && transcriptData.content) {
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: transcriptData.content,
        timestamp: transcriptData.timestamp || new Date().toISOString(),
        isVoice: true
      });
    }
  };

  /**
   * Add a new message to the chat
   */
  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  /**
   * Initialize voice session
   */
  const initializeVoiceSession = async () => {
    try {
      const authToken = await SecureStore.getItemAsync('accessToken');
      const storedPatientId = await SecureStore.getItemAsync('patientId');

      if (!authToken ||!storedPatientId) {
        Alert.alert('Authentication Error', 'Please login again to use voice features.');
        router.back();
        return;
      }

      patientId.current = storedPatientId;

      // Connect to WebSocket
      await webSocketService.connect({
        authToken,
        patientId: storedPatientId,
        onVoiceEvent: handleVoiceEvent,
        onStatusChange: handleConnectionStatus
      });

      // Initialize voice session through Vapi
      const config = await voiceService.initializeSession(authToken, assistantId);
      sessionId.current = voiceService.getSessionId() || '';

      console.log('Voice session initialized:', {
        sessionId: sessionId.current,
        patientId: patientId.current
      });

    } catch (error) {
      console.error('Failed to initialize voice session:', error);
      Alert.alert('Setup Error', 'Failed to initialize voice session. Please try again.');
    }
  };

  /**
   * Handle toggle listening
   */
  const handleToggleListening = () => {
    if (!webSocketService.isConnected()) {
      Alert.alert('Not Connected', 'Please wait for connection to establish.');
      return;
    }

    setIsListening(!isListening);

    if (!isListening) {
      // Start listening
      webSocketService.sendVoiceEvent('start_listening', {
        sessionId: sessionId.current,
        patientId: patientId.current
      });
    } else {
      // Stop listening
      webSocketService.sendVoiceEvent('stop_listening', {
        sessionId: sessionId.current,
        patientId: patientId.current
      });
    }
  };

  /**
   * Handle text input submission
   */
  const handleSubmitText = () => {
    if (!inputText.trim()) return;

    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      isVoice: false
    });

    setInputText('');

    // Send text as voice input (simulate)
    const textData = {
      content: inputText.trim(),
      type: 'text',
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(textData)], { type: 'application/json' });
    voiceService.sendVoiceInput(blob);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Assistant</Text>

          {/* Connection Status Indicator */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot,
              {
                backgroundColor: isConnected
                  ? Colors.primary
                  : isConnecting
                    ? Colors.accent
                    : Colors.primaryLight
              }
            ]} />
            <Text style={styles.statusText}>
              {isConnecting ? 'Connecting...' :
               isConnected? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {/* Messages Container */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage
              ]}
            >
              {message.role === 'assistant' && message.isVoice && (
                <FontAwesome
                  name="microphone"
                  size={12}
                  color={Colors.white}
                  style={styles.voiceIcon}
                />
              )}
              <Text style={[
                styles.messageText,
                message.role === 'user' ? styles.userText : styles.assistantText
              ]}>
                {message.content}
              </Text>
              <Text style={styles.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          ))}

          {typingMessage && (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>{typingMessage}</Text>
              <View style={styles.typingDots}>
                <View style={styles.dot} />
                <View style={[styles.dot, { animationDelay: '200ms' }]} />
                <View style={[styles.dot, { animationDelay: '400ms' }]} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Voice Control Section */}
        <View style={styles.voiceControlContainer}>
          <Text style={styles.voiceStatusText}>
            {isListening ? 'Listening...' : 'Tap and hold to talk'}
          </Text>

          <TouchableOpacity
            style={[
              styles.voiceButton,
              isListening && styles.voiceButtonActive
            ]}
            onPressIn={handleToggleListening}
            onPressOut={handleToggleListening}
            disabled={!isConnected}
          >
            <FontAwesome
              name="microphone"
              size={32}
              color={isListening ? Colors.white : Colors.primary}
            />
          </TouchableOpacity>

          <Text style={styles.voiceHint}>
            {isListening ? 'Release to stop' : 'Hold to speak'}
          </Text>
        </View>

        {/* Text Input Alternative */}
        {false && ( // Hidden for now - can uncomment to enable text input mode
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSubmitText}
              blurOnSubmit={true}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSubmitText}
              disabled={!inputText.trim()}
            >
              <FontAwesome name="send" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[300],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesContent: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    marginVertical: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 20,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 20,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: Colors.white,
  },
  assistantText: {
    color: Colors.text,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  voiceIcon: {
    marginRight: 5,
    alignSelf: 'flex-end',
  },
  voiceControlContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  voiceStatusText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 10,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  voiceButtonActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.1 }],
  },
  voiceHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    backgroundColor: Colors.background,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  typingText: {
    color: Colors.textSecondary,
    marginRight: 10,
  },
  typingDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
    marginHorizontal: 3,
  },
  disabled: {
    backgroundColor: Colors.gray[400],
  },
});

// Export a named export for type checking
export { VoiceChatScreen };