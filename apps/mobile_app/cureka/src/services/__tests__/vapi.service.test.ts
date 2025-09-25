import { voiceService } from '../vapi.service';

// Mock fetch
global.fetch = jest.fn();

describe('Vapi Voice Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service state
    (voiceService as any).config = null;
    (voiceService as any).isInitialized = false;
    (voiceService as any).listeners.clear();
  });

  describe('initializeSession', () => {
    const mockAuthToken = 'test-jwt-token';
    const mockResponse = {
      success: true,
      data: {
        session_id: 'sess_123',
        vapi_config: {
          jwt: 'vapi-jwt-token',
          assistantId: 'asst_test'
        }
      }
    };

    it('should successfully initialize session with valid token', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const config = await voiceService.initializeSession(mockAuthToken);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sessions/vapi/start'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockAuthToken}`
          },
          body: expect.any(String)
        })
      );

      expect(config).toEqual(expect.objectContaining({
        sessionId: 'sess_123',
        token: 'vapi-jwt-token'
      }));
      expect(voiceService.isServiceInitialized()).toBe(true);
    });

    it('should throw error when backend returns error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(voiceService.initializeSession(mockAuthToken))
        .rejects.toThrow('Backend API error: 500 Internal Server Error');
    });

    it('should throw error when backend returns non-success response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, message: 'Invalid assistant ID' })
      });

      await expect(voiceService.initializeSession(mockAuthToken, 'invalid-id'))
        .rejects.toThrow('Invalid assistant ID');
    });

    it('should use provided assistant ID', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await voiceService.initializeSession(mockAuthToken, 'custom-asst-id');

      const fetchCallBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(fetchCallBody).toEqual(expect.objectContaining({
        assistant_id: 'custom-asst-id'
      }));
    });
  });

  describe('startVoiceSession', () => {
    beforeEach(async () => {
      // Initialize the service first
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            session_id: 'sess_123',
            vapi_config: { jwt: 'token' }
          }
        })
      });
      await voiceService.initializeSession('token');
    });

    it('should start voice session when initialized', () => {
      const mockEventHandler = jest.fn();
      const listenerId = voiceService.startVoiceSession(mockEventHandler);

      expect(listenerId).toBeTruthy();
      expect(typeof listenerId).toBe('string');
      expect(mockEventHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'connection-status',
        data: { status: 'connecting' }
      }));
    });

    it('should handle connection success', (done) => {
      const mockEventHandler = jest.fn();
      voiceService.startVoiceSession(mockEventHandler);

      setTimeout(() => {
        expect(mockEventHandler).toHaveBeenCalledWith(expect.objectContaining({
          type: 'connection-status',
          data: { status: 'connected' }
        }));
        done();
      }, 1100);
    });

    it('should throw error if service not initialized', () => {
      // Reset to un-initialized state
      (voiceService as any).isInitialized = false;

      expect(() => voiceService.startVoiceSession(jest.fn()))
        .toThrow('Voice service not initialized. Call initializeSession first.');
    });
  });

  describe('stopVoiceSession', () => {
    beforeEach(async () => {
      // Initialize and start session
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            session_id: 'sess_123',
            vapi_config: { jwt: 'token' }
          }
        })
      });
      await voiceService.initializeSession('token');
    });

    it('should stop session and clean up', () => {
      const mockEventHandler = jest.fn();
      const listenerId = voiceService.startVoiceSession(mockEventHandler);

      // Stop the session
      voiceService.stopVoiceSession(listenerId);

      expect(mockEventHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'connection-status',
        data: { status: 'disconnected' }
      }));
    });

    it('should handle stopping non-existent session gracefully', () => {
      expect(() => voiceService.stopVoiceSession('non-existent-id')).not.toThrow();
    });

    it('should reset service when no listeners remain', () => {
      const mockEventHandler = jest.fn();
      const listenerId = voiceService.startVoiceSession(mockEventHandler);

      voiceService.stopVoiceSession(listenerId);

      // Service should be reset
      expect(voiceService.isServiceInitialized()).toBe(false);
      expect(voiceService.getSessionId()).toBeNull();
    });
  });

  describe('sendVoiceInput', () => {
    const mockBlob = new Blob(['test data'], { type: 'audio/wav' });

    beforeEach(async () => {
      // Initialize session
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            session_id: 'sess_123',
            vapi_config: { jwt: 'token' }
          }
        })
      });
      await voiceService.initializeSession('token');
    });

    it('should send voice input when service is initialized', async () => {
      const mockEventHandler = jest.fn();
      voiceService.startVoiceSession(mockEventHandler);

      await voiceService.sendVoiceInput(mockBlob);

      // Mock implementation sends mock response after 500ms
      setTimeout(() => {
        expect(mockEventHandler).toHaveBeenCalled();
        expect(mockEventHandler).toHaveBeenCalledWith(expect.objectContaining({
          type: 'transcript',
          data: expect.objectContaining({
            role: 'assistant',
            content: 'This is a simulated response from the AI.'
          })
        }));
      }, 600);
    });

    it('should throw error if service not initialized', async () => {
      await expect(voiceService.sendVoiceInput(mockBlob))
        .rejects.toThrow('Voice session not initialized');
    });

    it('should handle voice input errors', async () => {
      const mockError = new Error('Failed to send voice input');

      // Force an error by resetting the service state
      (voiceService as any).config.token = '';

      await expect(voiceService.sendVoiceInput(mockBlob))
        .rejects.toThrow('Voice session not initialized');
    });
  });

  describe('Utility Methods', () => {
    it('should return correct initialization status', () => {
      expect(voiceService.isServiceInitialized()).toBe(false);

      // Simulate initialization
      (voiceService as any).isInitialized = true;
      expect(voiceService.isServiceInitialized()).toBe(true);
    });

    it('should return correct session ID', () => {
      expect(voiceService.getSessionId()).toBeNull();

      // Simulate session with ID
      (voiceService as any).config = {
        sessionId: 'test-session-id'
      };
      expect(voiceService.getSessionId()).toBe('test-session-id');
    });
  });
});