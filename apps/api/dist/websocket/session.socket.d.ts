interface VoiceEvent {
    type: 'connection_status' | 'transcript' | 'function_call' | 'error';
    data: any;
    sessionId: string;
    timestamp: string;
}
export declare function setupVoiceSocketAuth(): void;
export declare function setupVoiceSocketHandlers(): void;
export declare function broadcastVoiceEvent(patientId: string, event: VoiceEvent, targetDeviceId?: string): void;
export declare function sendPushNotification(patientId: string, event: VoiceEvent): Promise<void>;
export {};
//# sourceMappingURL=session.socket.d.ts.map