import { io, Socket } from 'socket.io-client';
import { voiceService, VoiceEvent } from './vapi.service';

interface WebSocketOptions {
  authToken: string;
  patientId: string;
  onVoiceEvent: (event: VoiceEvent) => void;
  onStatusChange: (status: string) => void;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private options: WebSocketOptions | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds

  constructor() {
    // Constructor - setup can be done when connect() is called
  }

  /**
   * Connect to the backend WebSocket server
   */
  connect(options: WebSocketOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      this.options = options;
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cureka.onrender.com';

      try {
        // Create socket connection
        this.socket = io(apiUrl, {
          auth: {
            token: options.authToken
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectInterval,
          reconnectionDelayMax: 10000
        });

        this.setupEventHandlers();

        // Listen for connect success
        this.socket.once('connect', () => {
          console.log('WebSocket connected successfully');
          this.reconnectAttempts = 0;
          options.onStatusChange('connected');
          resolve();
        });

        // Listen for connect error
        this.socket.once('connect_error', (error: any) => {
          console.error('WebSocket connection error:', error);
          this.handleConnectionError(error);
          reject(error);
        });

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Handle successful connection
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      if (this.options) {
        this.options.onStatusChange('connected');
      }

      // Join patient-specific room
      this.socket?.emit('join_patient_room', { patientId: this.options?.patientId });

      // Initialize voice session
      this.initializeVoiceSession();
    });

    // Handle disconnection
    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from WebSocket:', reason);
      if (this.options) {
        this.options.onStatusChange('disconnected');
      }

      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, schedule reconnect
        this.scheduleReconnection();
      }
    });

    // Handle reconnection
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('Reconnected to WebSocket on attempt', attemptNumber);
      if (this.options) {
        this.options.onStatusChange('connected');
      }
    });

    // Handle reconnection attempts
    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('Reconnection attempt', attemptNumber);
      this.reconnectAttempts = attemptNumber;
      if (this.options) {
        this.options.onStatusChange('connecting');
      }
    });

    // Handle voice session events
    this.socket.on('voice_session_initialized', (data: any) => {
      console.log('Voice session initialized:', data);
      this.handleVoiceSessionEvent({
        type: 'connection-status',
        data: { status: 'initialized' },
        timestamp: new Date().toISOString()
      });
    });

    // Handle voice events
    this.socket.on('voice_event', (event: VoiceEvent) => {
      console.log('Received voice event:', event);
      this.handleVoiceSessionEvent(event);
    });

    // Handle voice control updates
    this.socket.on('voice_control_update', (data: any) => {
      console.log('Voice control update:', data);
      // Handle control commands if needed
    });

    // Handle device disconnection
    this.socket.on('device_disconnected', (data: any) => {
      console.log('Device disconnected:', data);
      // Handle multi-device scenarios if needed
    });
  }

  /**
   * Initialize voice session through the WebSocket
   */
  private initializeVoiceSession(): void {
    if (!this.socket) return;

    console.log('Initializing voice session...');

    // Connect to voice service
    const listenerId = voiceService.startVoiceSession((event: VoiceEvent) => {
      // Forward events to UI
      if (this.options) {
        this.options.onVoiceEvent(event);
      }

      // Update status based on event type
      if (event.type === 'connection-status') {
        const status = event.data.status;
        if (this.options) {
          this.options.onStatusChange(status);
        }

        // Handle specific status updates
        if (status === 'connected') {
          console.log('Voice session connected successfully');
          this.socket?.emit('voice_session_update', {
            sessionId: voiceService.getSessionId(),
            patientId: this.options?.patientId,
            status: 'active'
          });
        }
      }
    });

    // Store listener ID for cleanup
    (voiceService as any).currentListenerId = listenerId;
  }

  /**
   * Handle voice session events
   */
  private handleVoiceSessionEvent(event: VoiceEvent): void {
    // Forward to the UI callback
    if (this.options) {
      this.options.onVoiceEvent(event);
    }

    // Emit event to voice service for processing
    if (voiceService.isServiceInitialized()) {
      // Simulate processing in voice service
      console.log('Processing voice session event through WebSocket');
    }
  }

  /**
   * Send voice event through WebSocket
   */
  sendVoiceEvent(eventType: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, cannot send voice event');
      return;
    }

    this.socket.emit('voice_event', {
      type: eventType,
      data: data,
      patientId: this.options?.patientId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      // First stop the voice session
      if (voiceService.isServiceInitialized()) {
        const listenerId = (voiceService as any).currentListenerId;
        if (listenerId) {
          voiceService.stopVoiceSession(listenerId);
        }
      }

      // Notify disconnection before cleanup
      const options = this.options;

      // Then disconnect the socket
      this.socket.disconnect();
      this.socket = null;
      this.options = null;

      if (options) {
        options.onStatusChange('disconnected');
      }
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: any): void {
    console.error('Connection error details:', error.message, error.description);
    this.scheduleReconnection();
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      // Notify UI about permanent disconnection
      if (this.options) {
        this.options.onStatusChange('error');
      }
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current socket ID
   */
  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return voiceService.getSessionId();
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();