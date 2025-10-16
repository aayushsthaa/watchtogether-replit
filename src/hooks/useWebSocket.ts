import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface WebSocketMessage {
  type: 'message' | 'user_joined' | 'user_left' | 'mode_changed' | 'ownership_transferred' | 'room_updated';
  data: any;
  roomId?: string;
  userId?: string;
  username?: string;
  timestamp?: string;
}

export function useWebSocket(roomId: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const connect = useCallback(() => {
    if (!roomId) return;

    const token = getToken();
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
          type: 'join_room',
          data: { roomId }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'message':
              queryClient.invalidateQueries({ queryKey: ['rooms', roomId, 'messages'] });
              break;

            case 'user_joined':
            case 'user_left':
            case 'mode_changed':
            case 'ownership_transferred':
            case 'room_updated':
              queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
              queryClient.invalidateQueries({ queryKey: ['rooms'] });
              break;
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [roomId, getToken, queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      if (roomId && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'leave_room',
          data: { roomId }
        }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [roomId]);

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { sendMessage };
}
