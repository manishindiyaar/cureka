import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
export const io = new SocketIOServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
import authRoutes from './api/v1/auth/index.js';
import doctorsRoutes from './api/v1/doctors/doctors.routes.js';
import hospitalsRoutes from './api/v1/hospitals/hospitals.routes.js';
import appointmentRoutes from './api/v1/appointments/appointments.routes.js';
import vapiSessionRoutes from './api/v1/sessions/vapi/vapi.routes.js';
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctors', doctorsRoutes);
app.use('/api/v1/hospitals', hospitalsRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/sessions', vapiSessionRoutes);
app.get('/', (_req, res) => {
    res.json({ message: 'Cureka API is running' });
});
import { setupVoiceSocketHandlers, setupVoiceSocketAuth } from './websocket/session.socket.js';
setupVoiceSocketAuth();
setupVoiceSocketHandlers();
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        code: 'internal_error',
        message: 'Something went wrong!'
    });
});
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map