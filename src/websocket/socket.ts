import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../auth/auth';

let io: SocketIOServer | null = null;

export function initWebSocketServer(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Protect WebSocket connections with admin auth token
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Unauthorized: Authentication token required'));
    }
    const { valid } = verifyToken(String(token));
    if (!valid) {
      return next(new Error('Unauthorized: Invalid or expired token'));
    }
    next();
  });

  io.on('connection', (socket) => {
    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
}

export function broadcastMessage(data: any) {
  if (io) {
    io.emit('message:new', data);
  }
}

export function broadcastContactUpdate(data: any) {
  if (io) {
    io.emit('contact:update', data);
  }
}
