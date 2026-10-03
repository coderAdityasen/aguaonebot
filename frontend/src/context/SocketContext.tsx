import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, Contact } from '../types';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  latestMessage: Message | null;
  latestContactUpdate: Contact | null;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  latestMessage: null,
  latestContactUpdate: null
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestMessage, setLatestMessage] = useState<Message | null>(null);
  const [latestContactUpdate, setLatestContactUpdate] = useState<Contact | null>(null);

  useEffect(() => {
    // In dev, Vite proxies /socket.io to :3000. In prod, same origin.
    const s = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('message:new', (msg: Message) => {
      setLatestMessage(msg);
    });

    s.on('contact:update', (contact: Contact) => {
      setLatestContactUpdate(contact);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, latestMessage, latestContactUpdate }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
