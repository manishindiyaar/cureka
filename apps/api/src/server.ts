import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

const app: express.Express = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.IO for real-time communication
export const io = new Server(server, {
  cors: {
    origin: "*", // Configure based on your frontend
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes
import authRoutes from './api/v1/auth/index.js';
import doctorsRoutes from './api/v1/doctors/doctors.routes.js';
import hospitalsRoutes from './api/v1/hospitals/hospitals.routes.js';
import appointmentRoutes from './api/v1/appointments/appointments.routes.js';
import vapiSessionRoutes from './api/v1/sessions/vapi/vapi.routes.js';

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctors', doctorsRoutes);
app.use('/api/v1/hospitals', hospitalsRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/sessions', vapiSessionRoutes);

// Default route
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Cureka API is running' });
});

// Import Socket.IO handlers
import { setupVoiceSocketHandlers, setupVoiceSocketAuth, broadcastVoiceEvent } from './websocket/session.socket.js';

// Setup Socket.IO handlers
setupVoiceSocketAuth();
setupVoiceSocketHandlers();

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    code: 'internal_error',
    message: 'Something went wrong!'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});