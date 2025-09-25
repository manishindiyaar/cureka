// Voice Service Tests - Following backend pattern
const SimpleTestRunner = require('./test-utils.js');
const runner = new SimpleTestRunner();

// Mock exports to simulate the actual service
const mockVoiceService = {
  isInitialized: false,
  sessionId: null,
  token: null,
  listeners: new Map(),
  resetState() {
    this.isInitialized = false;
    this.sessionId = null;
    this.token = null;
    this.listeners.clear();
  },

  async initializeSession(userToken, assistantId) {
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
    if (!this.isInitialized) {
      throw new Error('Voice service not initialized. Call initializeSession first.');
    }

    const listenerId = 'listener_' + Date.now();
    this.listeners.set(listenerId, onEvent);

    // Simulate connection
    setTimeout(() => {
      onEvent({ type: 'connection-status', data: { status: 'connected' } });
    }, 100);

    return listenerId;
  },

  stopVoiceSession(listenerId) {
    const listener = this.listeners.get(listenerId);
    if (listener) {
      listener({ type: 'connection-status', data: { status: 'disconnected' } });
      this.listeners.delete(listenerId);

      if (this.listeners.size === 0) {
        this.isInitialized = false;
        this.sessionId = null;
      }
    }
  },

  sendVoiceInput(audioData) {
    if (!this.isInitialized) throw new Error('Voice session not initialized');

    // Simulate processing
    setTimeout(() => {
      this.listeners.forEach(listener => {
        listener({
          type: 'transcript',
          data: { role: 'assistant', content: 'Simulated response' },
          timestamp: new Date().toISOString()
        });
      });
    }, 300);
  },

  getSessionId() {
    return this.sessionId;
  },

  isServiceInitialized() {
    return this.isInitialized;
  }
};

// Test Suite
runner.describe('Vapi Voice Service', () => {

  // Test: Initialize Session
  runner.describe('initializeSession', () => {

    runner.it('should successfully initialize with valid token', async () => {
      mockVoiceService.resetState();
      const result = await mockVoiceService.initializeSession('valid-token');

      runner.expect(result.sessionId).toBeTruthy();
      runner.expect(result.token).toBeTruthy();
      runner.expect(mockVoiceService.isServiceInitialized()).toBe(true);
    });

    runner.it('should throw error with invalid token', async () => {
      mockVoiceService.resetState();
      try {
        await mockVoiceService.initializeSession(null);
        throw new Error('Should have thrown');
      } catch (error) {
        runner.expect(error.message).toEqual('Invalid token');
      }
    });

    runner.it('should handle initialization with assistant ID', async () => {
      mockVoiceService.resetState();
      const result = await mockVoiceService.initializeSession('token', 'assistant-123');

      runner.expect(result.sessionId).toBeTruthy();
      runner.expect(mockVoiceService.getSessionId()).toBeTruthy();
    });
  });

  // Test: Start Session
  runner.describe('startVoiceSession', () => {

    runner.beforeEach(async fn = () => {
      mockVoiceService.resetState();
      await mockVoiceService.initializeSession('token');
    })();

    runner.it('should start session when initialized', () => {
      const mockHandler = runner.jest.fn();
      const listenerId = mockVoiceService.startVoiceSession(mockHandler);

      runner.expect(listenerId).toBeTruthy();
      runner.expect(typeof listenerId).toEqual('string');

      // Check initial event
      runner.expect(mockHandler).toHaveBeenCalledWith({
        type: 'connection-status',
        data: { status: 'connecting' }
      });
    });

    runner.it('should handle connection success', (done) => {
      const mockHandler = runner.jest.fn();
      mockVoiceService.startVoiceSession(mockHandler);

      setTimeout(() => {
        runner.expect(mockHandler).toHaveBeenCalledWith({
          type: 'connection-status',
          data: { status: 'connected' }
        });
        done();
      }, 150);
    });

    runner.it('should throw if not initialized', () => {
      mockVoiceService.resetState();
      runner.expect(() => mockVoiceService.startVoiceSession(runner.jest.fn()))
        .toThrow('Voice service not initialized. Call initializeSession first.');
    });
  });

  // Test: Stop Session
  runner.describe('stopVoiceSession', () => {

    runner.beforeEach(async fn = () => {
      mockVoiceService.resetState();
      await mockVoiceService.initializeSession('token');
    })();

    runner.it('should stop and clean up session', () => {
      const mockHandler = runner.jest.fn();
      const listenerId = mockVoiceService.startVoiceSession(mockHandler);

      mockVoiceService.stopVoiceSession(listenerId);

      runner.expect(mockHandler).toHaveBeenCalledWith({
        type: 'connection-status',
        data: { status: 'disconnected' }
      });
    });

    runner.it('should handle stopping non-existent session gracefully', () => {
      runner.expect(() => mockVoiceService.stopVoiceSession('non-existent')).not.toThrow();
    });

    runner.it('should reset service when no listeners remain', () => {
      const mockHandler = runner.jest.fn();
      const listenerId = mockVoiceService.startVoiceSession(mockHandler);

      mockVoiceService.stopVoiceSession(listenerId);

      runner.expect(mockVoiceService.isServiceInitialized()).toBe(false);
      runner.expect(mockVoiceService.getSessionId()).toBeNull();
    });
  });

  // Test: Voice Input Processing
  runner.describe('sendVoiceInput', () => {

    runner.beforeEach(async fn = () => {
      mockVoiceService.resetState();
      await mockVoiceService.initializeSession('token');
    })();

    runner.it('should process voice input and return transcript', (done) => {
      const mockHandler = runner.jest.fn();
      mockVoiceService.startVoiceSession(mockHandler);

      mockVoiceService.sendVoiceInput(null); // Mock audio data

      setTimeout(() => {
        runner.expect(mockHandler).toHaveBeenCalledWith({
          type: 'transcript',
          data: { role: 'assistant', content: 'Simulated response' }
        });
        done();
      }, 400);
    });

    runner.it('should throw if service not initialized', () => {
      mockVoiceService.resetState();
      runner.expect(() => mockVoiceService.sendVoiceInput(null))
        .toThrow('Voice session not initialized');
    });

    runner.it('broadcasts to all listeners', (done) => {
      const mockHandler1 = runner.jest.fn();
      const mockHandler2 = runner.jest.fn();

      mockVoiceService.startVoiceSession(mockHandler1);
      mockVoiceService.startVoiceSession(mockHandler2);

      mockVoiceService.sendVoiceInput(null);

      setTimeout(() => {
        runner.expect(mockHandler1).toHaveBeenCalled();
        runner.expect(mockHandler2).toHaveBeenCalled();
        done();
      }, 400);
    });
  });

  // Utility Methods Tests
  runner.describe('Utility Methods', () => {

    runner.it('returns correct initialization status', () => {
      mockVoiceService.resetState();
      runner.expect(mockVoiceService.isServiceInitialized()).toBe(false);

      mockVoiceService.isInitialized = true;
      runner.expect(mockVoiceService.isServiceInitialized()).toBe(true);
    });

    runner.it('returns correct session ID', () => {
      mockVoiceService.resetState();
      runner.expect(mockVoiceService.getSessionId()).toBeNull();

      mockVoiceService.sessionId = 'test-session';
      runner.expect(mockVoiceService.getSessionId()).toEqual('test-session');
    });
  });
});

// Run the tests
const results = runner.finish();
console.log('\n📊 Test Summary:');
console.log('Tests Ran:', results.results.length);
console.log('Passed:', results.passed);
console.log('Failed:', results.failed);