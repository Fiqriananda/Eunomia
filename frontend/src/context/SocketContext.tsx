'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, workspace } = useAuth();

  useEffect(() => {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (workspace?.id) {
        newSocket.emit('join_workspace', { workspaceId: workspace.id });
      }
      if (user?.id) {
        newSocket.emit('join_user', { userId: user.id });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && isConnected && workspace?.id) {
      socket.emit('join_workspace', { workspaceId: workspace.id });
    }
  }, [socket, isConnected, workspace?.id]);

  useEffect(() => {
    if (socket && isConnected && user?.id) {
      socket.emit('join_user', { userId: user.id });
    }
  }, [socket, isConnected, user?.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
