import { io } from '../server.js';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
export function setupVoiceSocketAuth() {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            const user = await verifyAccessToken(token);
            socket.data.user = user;
            next();
        }
        catch (error) {
            console.error('WebSocket auth error:', error);
            next(new Error('Authentication failed'));
        }
    });
}
export function setupVoiceSocketHandlers() {
    io.on('connection', (socket) => {
        const userId = socket.data.user?.userId;
        const patientId = socket.data.user?.patientId;
        console.log(`Patient ${patientId} connected to voice sessions`);
        socket.join(`patient-${patientId}`);
        socket.on('initialize_voice_session', async (data) => {
            try {
                const { vapiConfig } = data;
                socket.emit('voice_session_initialized', {
                    success: true,
                    timestamp: new Date().toISOString()
                });
                socket.to(`patient-${patientId}`).emit('voice_session_active', {
                    patientId,
                    sessionStatus: 'initializing',
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                socket.emit('error', {
                    type: 'initialize_error',
                    message: 'Failed to initialize voice session'
                });
            }
        });
        socket.on('voice_control', async (data) => {
            try {
                const { command, sessionId } = data;
                socket.to(`patient-${patientId}`).emit('voice_control_update', {
                    command,
                    sessionId,
                    fromDevice: socket.id,
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                socket.emit('error', {
                    type: 'control_error',
                    message: 'Voice control failed'
                });
            }
        });
        socket.on('disconnect', () => {
            console.log(`Patient ${patientId} disconnected`);
            socket.to(`patient-${patientId}`).emit('device_disconnected', {
                deviceId: socket.id,
                timestamp: new Date().toISOString()
            });
        });
    });
}
export function broadcastVoiceEvent(patientId, event, targetDeviceId) {
    const eventData = {
        ...event,
        timestamp: new Date().toISOString()
    };
    if (targetDeviceId) {
        io.sockets.sockets.forEach((socket) => {
            if (socket.rooms.has(`patient-${patientId}`) && socket.id === targetDeviceId) {
                socket.emit('voice_event', eventData);
            }
        });
    }
    else {
        io.to(`patient-${patientId}`).emit('voice_event', eventData);
    }
    console.log(`Broadcasted ${event.type} event to patient ${patientId}`);
}
export async function sendPushNotification(patientId, event) {
    try {
        const patient = await prisma.patient.findUnique({
            where: { userId: patientId },
            select: {
                userId: true,
                user: {
                    select: {
                        id: true
                    }
                }
            }
        });
        if (!patient?.user?.id) {
            console.log(`No userId found for patient ${patientId}`);
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: patientId },
            select: {
                email: true,
                phone: true
            }
        });
        if (!user) {
            console.log(`No user found for patient ${patientId}`);
            return;
        }
        console.log(`Skipping push notification for patient ${patientId} - pushToken field not available in schema`);
        return;
    }
    catch (error) {
        console.error('Push notification error:', error);
    }
}
//# sourceMappingURL=session.socket.js.map