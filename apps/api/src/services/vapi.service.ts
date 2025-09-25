import crypto from 'crypto';

interface VapiConfig {
  config: {
    public_key: string;
    assistant_id: string;
    session_config: {
      web: boolean;
      app: boolean;
      voice_profile_id: string;
    };
  };
  sessionId: string;
}

class VapiService {
  /**
   * Generate Vapi configuration for authenticated patient
   * This provides public configuration data to the mobile app
   */
  async getVapiConfiguration(assistantId: string, patientId: string): Promise<VapiConfig> {
    try {
      // Ensure we have the required environment variables
      const publicKey = process.env.VAPI_PUBLIC_API_KEY;
      if (!publicKey) {
        throw new Error('Vapi public API key not configured');
      }

      // Generate a session ID for tracking
      const sessionId = `vapi-${crypto.randomBytes(8).toString('hex')}`;

      // Build configuration
      const config: VapiConfig = {
        config: {
          public_key: publicKey,
          assistant_id: assistantId,
          session_config: {
            web: true,
            app: true,
            voice_profile_id: process.env.VAPI_VOICE_PROFILE_ID || 'default'
          }
        },
        sessionId: sessionId
      };

      // In a real implementation, you might:
      // 1. Log the session creation
      // 2. Check patient permissions
      // 3. Rate limiting can be implemented here
      // 4. Audit logging can be added

      console.log(`Vapi configuration generated for patient ${patientId}: ${sessionId}`);

      return config;
    } catch (error) {
      console.error('VapiService.getVapiConfiguration error:', error);
      throw error;
    }
  }

  /**
   * Validate Vapi API credentials
   */
  validateCredentials(): boolean {
    const required = {
      publicKey: process.env.VAPI_PUBLIC_API_KEY,
      assistantId: process.env.VAPI_ASSISTANT_ID,
    };

    return !!required.publicKey && !!required.assistantId;
  }
}

export const vapiService = new VapiService();