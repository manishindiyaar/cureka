// Simplified Voice Service Tests
const SimpleTestRunner = require('./test-utils.js');
const runner = new SimpleTestRunner();

// Mock voice service for testing
const createMockVoiceService = () => ({
  isInitialized: false,
  sessionId: null,
  token: null,
  listeners: new Map(),

  async initializeSession(userToken) {
    if (!userToken) throw new Error('Invalid token');

    this.token = userToken;
    this.sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
    this.isInitialized = true;

    return {
      sessionId: this.sessionId,
      token: 'vapi_' + Math.random().toString(36).substr(2, 10)
    };
  },

  startVoiceSession(onEvent) {
    if (!this.isInitialized) throw new Error('Voice service not initialized');

    const listenerId = 'list_' + Date.now();
    this.listeners.set(listenerId, onEvent);
    onEvent({ type: 'connection', status: 'connecting' });

    return listenerId;
  },

  stopVoiceSession(listenerId) {
    const listener = this.listeners.get(listenerId);
    if (listener) {
      listener({ type: 'connection', status: 'disconnected' });
      this.listeners.delete(listenerId);

      if (this.listeners.size === 0) {
        this.isInitialized = false;
      }
    }
  },

  getSessionId() { return this.sessionId; },
  isServiceInitialized() { return this.isInitialized; }
});

// Tests
runner.describe('Voice Service Initialization', () => {
  const service = createMockVoiceService();
  service.resetState = function() {
    this.isInitialized = false;
    this.sessionId = null;
    this.token = null;
    this.listeners.clear();
  };

  runner.it('should initialize with valid token', async () => {
    service.resetState();
    const result = await service.initializeSession('token123');

    runner.expect(result.sessionId).toBeTruthy();
    runner.expect(service.isServiceInitialized()).toBe(true);
  });

  runner.it('should throw with invalid token', async () => {
    service.resetState();
    try {
      await service.initializeSession(null);
      throw new Error('Should fail');
    } catch (error) {
      runner.expect(error.message).toBe('Invalid token');
    }
  });

  runner.it('should start voice session when initialized', () => {
    service.resetState();
    service.initializeSession('token'); // Initialize first

    const handler = runner.jest.fn();
    const listenerId = service.startVoiceSession(handler);

    runner.expect(listenerId).toBeTruthy();
    runner.expect(handler).toHaveBeenCalledWith({
      type: 'connection',
      status: 'connecting'
    });
  });

  runner.it('should stop voice session properly', () => {
    service.resetState();
    service.initializeSession('token');

    const handler = runner.jest.fn();
    const listenerId = service.startVoiceSession(handler);

    service.stopVoiceSession(listenerId);

    runner.expect(service.isServiceInitialized()).toBe(false);
  });
});

runner.describe('WebSocket Connection Tests', () => {
  const mockWebSocketService = {
    connected: false,
    sessionId: null,

    connect(authToken, patientId) {
      this.connected = true;
      this.sessionId = `${patientId}_session`;
      return true;
    },

    disconnect() {
      this.connected = false;
      this.sessionId = null;
    },

    sendEvent(type, data) {
      if (!this.connected) throw new Error('Not connected');
      return { type, data, timestamp: Date.now() };
    },

    isConnected() { return this.connected; },
    getSessionId() { return this.sessionId; }
  };

  runner.it('should connect with valid credentials', () => {
    mockWebSocketService.connected = false;

    const result = mockWebSocketService.connect('token123', 'patient123');

    runner.expect(result).toBe(true);
    runner.expect(mockWebSocketService.isConnected()).toBe(true);
    runner.expect(mockWebSocketService.getSessionId()).toContain('patient123');
  });

  runner.it('should handle events when connected', () => {
    mockWebSocketService.connect('token', 'patient');

    const event = mockWebSocketService.sendEvent('voice_event', { message: 'test' });

    runner.expect(event.type).toBe('voice_event');
    runner.expect(event.data.message).toBe('test');
  });

  runner.it('should throw trying to send when disconnected', () => {
    mockWebSocketService.disconnect();

    try {
      mockWebSocketService.sendEvent('test', {});
      throw new Error('Should fail');
    } catch (error) {
      runner.expect(error.message).toBe('Not connected');
    }
  });
});

runner.describe('Error Handling', () => {
  runner.it('should handle service initialization errors gracefully', () => {
    const mockService = { initializeSession: runner.jest.fn(() => {
      throw new Error('Network error');
    })};

    try {
      mockService.initializeSession();
      throw new Error('Should fail');
    } catch (error) {
      runner.expect(error.message).toBe('Network error');
    }
    runner.expect(mockService.initializeSession).toHaveBeenCalled();
  });

  runner.it('should validate input parameters', () => {
    const validateToken = (token) => {
      if (!token || token.length < 10) throw new Error('Token too short');
      return true;
    };

    runner.expect(() => validateToken(null)).toThrow('Token too short');
    runner.expect(() => validateToken('short')).toThrow('Token too short');
    runner.expect(validateToken('long_enough_token')).toBe(true);
  });
});

// Run tests
runner.finish();
console.log('\n📋 Mobile Voice Agent Tests Complete');