import { io } from '../server.js';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

/**
 * Voice Session Socket Handler
 * Handles real-time WebSocket connections for voice AI sessions
 */

interface VoiceEvent {
  type: 'connection_status' | 'transcript' | 'function_call' | 'error';
  data: any;
  sessionId: string;
  timestamp: string;
}

interface VoiceSessionUpdate {
  sessionId: string;
  event: 'start' | 'end' | 'update';
  data: VoiceEvent;
}

/**
 * Setup WebSocket authentication middleware
 */
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
    } catch (error) {
      console.error('WebSocket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });
}

/**
 * Setup voice session event handlers
 */
export function setupVoiceSocketHandlers() {
  io.on('connection', (socket) => {
    const userId = socket.data.user?.userId;
    const patientId = socket.data.user?.patientId;

    console.log(`Patient ${patientId} connected to voice sessions`);

    // Join patient-specific room
    socket.join(`patient-${patientId}`);

    /**
     * Handle voice session initialization
     */
    socket.on('initialize_voice_session', async (data) => {
      try {
        const { vapiConfig } = data;

        // Emit confirmation
        socket.emit('voice_session_initialized', {
          success: true,
          timestamp: new Date().toISOString()
        });

        // Notify other devices of this patient
        socket.to(`patient-${patientId}`).emit('voice_session_active', {
          patientId,
          sessionStatus: 'initializing',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        socket.emit('error', {
          type: 'initialize_error',
          message: 'Failed to initialize voice session'
        });
      }
    });

    /**
     * Handle voice control commands
     */
    socket.on('voice_control', async (data) => {
      try {
        const { command, sessionId } = data;

        // Broadcast command to other devices
        socket.to(`patient-${patientId}`).emit('voice_control_update', {
          command,
          sessionId,
          fromDevice: socket.id,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        socket.emit('error', {
          type: 'control_error',
          message: 'Voice control failed'
        });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      console.log(`Patient ${patientId} disconnected`);

      // Notify other devices
      socket.to(`patient-${patientId}`).emit('device_disconnected', {
        deviceId: socket.id,
        timestamp: new Date().toISOString()
      });
    });
  });
}

/**
 * Broadcast voice events from Vapi webhook to patient
 */
export function broadcastVoiceEvent(
  patientId: string,
  event: VoiceEvent,
  targetDeviceId?: string // Optional - specific device to target
) {
  const eventData = {
    ...event,
    timestamp: new Date().toISOString()
  };

  if (targetDeviceId) {
    // Send to specific device
    io.sockets.sockets.forEach((socket: any) => {
      if (socket.rooms.has(`patient-${patientId}`) && socket.id === targetDeviceId) {
        socket.emit('voice_event', eventData);
      }
    });
  } else {
    // Broadcast to all devices for this patient
    io.to(`patient-${patientId}`).emit('voice_event', eventData);
  }

  console.log(`Broadcasted ${event.type} event to patient ${patientId}`);
}

/**
 * Send push notification as fallback when no WebSocket connections
 */
export async function sendPushNotification(patientId: string, event: VoiceEvent) {
  try {
    // Get patient's user details including FCM token
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

    // Send to FCM
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

  } catch (error) {
    console.error('Push notification error:', error);
  }
}