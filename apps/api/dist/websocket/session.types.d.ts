export interface VoiceEvent {
    type: 'connection_status' | 'transcript' | 'function_call' | 'error';
    data: any;
    sessionId: string;
    timestamp: string;
}
export interface VoiceSessionUpdate {
    sessionId: string;
    event: 'start' | 'end' | 'update';
    data: VoiceEvent;
}
//# sourceMappingURL=session.types.d.ts.map