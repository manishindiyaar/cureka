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
            where: { id: patientId },
            select: {
                userId: true,
                user: {
                    select: {
                        pushToken: true
                    }
                }
            }
        });
        if (!patient?.user?.pushToken) {
            console.log(`No push token for patient ${patientId}`);
            return;
        }
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Authorization': `key=${process.env.FCM_SERVER_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: patient.user.pushToken,
                data: event,
                android: {
                    priority: 'high',
                    timeToLive: 60
                },
                ios: {
                    priority: 10
                }
            })
        });
        if (!response.ok) {
            console.error('Failed to send push notification');
        }
    }
    catch (error) {
        console.error('Push notification error:', error);
    }
}
//# sourceMappingURL=session.socket.js.map