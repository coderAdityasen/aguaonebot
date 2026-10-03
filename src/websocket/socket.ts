import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export function initWebSocketServer(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
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
