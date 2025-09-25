import crypto from 'crypto';
class VapiService {
    async getVapiConfiguration(assistantId, patientId) {
        try {
            const publicKey = process.env.VAPI_PUBLIC_API_KEY;
            if (!publicKey) {
                throw new Error('Vapi public API key not configured');
            }
            const sessionId = `vapi-${crypto.randomBytes(8).toString('hex')}`;
            const config = {
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
            console.log(`Vapi configuration generated for patient ${patientId}: ${sessionId}`);
            return config;
        }
        catch (error) {
            console.error('VapiService.getVapiConfiguration error:', error);
            throw error;
        }
    }
    validateCredentials() {
        const required = {
            publicKey: process.env.VAPI_PUBLIC_API_KEY,
            assistantId: process.env.VAPI_ASSISTANT_ID,
        };
        return !!required.publicKey && !!required.assistantId;
    }
}
export const vapiService = new VapiService();
//# sourceMappingURL=vapi.service.js.map