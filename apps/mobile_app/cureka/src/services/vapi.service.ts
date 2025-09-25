import Constants from 'expo-constants';
import { Buffer } from 'buffer';

// Polyfill Buffer for web compatibility
global.Buffer = global.Buffer || Buffer;

// Vapi configuration types
interface VapiConfig {
  baseUrl: string;
  token: string;
  sessionId: string;
  assistantId?: string;
}

// Voice event types
export interface VoiceEvent {
  type: 'transcript' | 'bot-speaking' | 'user-speaking' | 'connection-status';
  data: any;
  timestamp: string;
}

export class VoiceService {
  private config: VapiConfig | null = null;
  private isInitialized = false;
  private listeners: Map<string, (event: VoiceEvent) => void> = new Map();

  constructor() {
    // Initialize the service
    this.initializeFromEnv();
  }

  private initializeFromEnv() {
    const vapiBaseUrl = Constants.expoConfig?.extra?.vapiBaseUrl || 'https://api.vapi.ai';
    this.config = {
      baseUrl: vapiBaseUrl,
      token: '', // Will be set during session initialization
      sessionId: '' // Will be set during session initialization
    };
  }

  /**
   * Initialize a voice session with Vapi
   */
  async initializeSession(userToken: string, assistantId?: string): Promise<VapiConfig> {
    try {
      // Call backend to get Vapi session configuration
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/sessions/vapi/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          assistant_id: assistantId ||process.env.EXPO_PUBLIC_VAPI_ASSISTANT_ID,
          type: 'web'
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to initialize Vapi session');
      }

      const { vapi_config, session_id } = result.data;

      // Update local config
      this.config = {
        baseUrl: this.config?.baseUrl || 'https://api.vapi.ai',
        token: vapi_config.jwt,
        sessionId: session_id,
        assistantId: vapi_config.assistantId
      };

      this.isInitialized = true;
      return this.config;

    } catch (error) {
      console.error('Failed to initialize Vapi session:', error);
      throw error;
    }
  }

  /**
   * Start a voice session with the initialized configuration
   */
  startVoiceSession(onEvent: (event: VoiceEvent) => void): string {
    if (!this.config ||!this.isInitialized) {
      throw new Error('Voice service not initialized. Call initializeSession first.');
    }

    // Generate a unique listener ID
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.listeners.set(listenerId, onEvent);

    // Emit initial connection status
    this.emitEvent({
      type: 'connection-status',
      data: { status: 'connecting' },
      timestamp: new Date().toISOString()
    }, listenerId);

    // Simulate Vapi connection (since direct Vapi SDK usage in React Native is complex)
    // In a real implementation, you would integrate with @vapi-ai/react-native here
    setTimeout(() => {
      // Mock successful connection
      this.emitEvent({
        type: 'connection-status',
        data: { status: 'connected' },
        timestamp: new Date().toISOString()
      }, listenerId);
    }, 1000);

    // For now, return the listener ID for managing the session
    return listenerId;
  }

  /**
   * Stop a voice session
   */
  stopVoiceSession(listenerId: string): void {
    if (this.listeners.has(listenerId)) {
      // Emit disconnected event
      this.emitEvent({
        type: 'connection-status',
        data: { status: 'disconnected' },
        timestamp: new Date().toISOString()
      }, listenerId);

      // Remove listener
      this.listeners.delete(listenerId);

      // If no more listeners, clean up
      if (this.listeners.size === 0) {
        this.config = null;
        this.isInitialized = false;
      }
    }
  }

  /**
   * Send voice input to Vapi
   */
  async sendVoiceInput(audioData: Blob): Promise<void> {
    if (!this.config?.token) {
      throw new Error('Voice session not initialized');
    }

    try {
      // In a real implementation, this would send audio data to Vapi
      // For now, let's simulate with a mock response
      setTimeout(() => {
        // Simulate AI response
        const mockResponse: VoiceEvent = {
          type: 'transcript',
          data: {
            role: 'assistant',
            content: 'This is a simulated response from the AI.',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        };

        // Emit to all listeners
        this.listeners.forEach((listener, id) => {
          this.emitEvent(mockResponse, id);
        });
      }, 500);

    } catch (error) {
      console.error('Failed to send voice input:', error);
      throw error;
    }
  }

  /**
   * Emit event to specific listener
   */
  private emitEvent(event: VoiceEvent, listenerId: string): void {
    const listener = this.listeners.get(listenerId);
    if (listener) {
      listener(event);
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.config?.sessionId || null;
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const voiceService = new VoiceService();