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
declare class VapiService {
    getVapiConfiguration(assistantId: string, patientId: string): Promise<VapiConfig>;
    validateCredentials(): boolean;
}
export declare const vapiService: VapiService;
export {};
//# sourceMappingURL=vapi.service.d.ts.map