import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import url from 'url';

const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  username?: string;
  roomId?: string;
  isAlive?: boolean;
}

interface WSMessage {
  type: 'message' | 'user_joined' | 'user_left' | 'mode_changed' | 'video_sync' | 'ownership_transferred' | 'room_updated';
  data: any;
  roomId?: string;
  userId?: string;
  username?: string;
  timestamp?: string;
}

// Store connections by roomId
const roomConnections = new Map<string, Set<AuthenticatedWebSocket>>();

export function setupWebSocket(httpServer: HTTPServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Heartbeat to detect broken connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as AuthenticatedWebSocket;
      if (client.isAlive === false) {
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    ws.isAlive = true;
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Authenticate via JWT from query param
    const queryParams = url.parse(req.url || '', true).query;
    const token = queryParams.token as string;

    if (!token) {
      ws.close(4001, 'Authentication token required');
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        _id: string;
        username: string;
        isAdmin: boolean;
      };

      ws.userId = decoded._id;
      ws.username = decoded.username;

      console.log(`WebSocket connected: ${decoded.username} (${decoded._id})`);
    } catch (error) {
      ws.close(4002, 'Invalid authentication token');
      return;
    }

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'join_room':
            handleJoinRoom(ws, message.data.roomId);
            break;

          case 'leave_room':
            handleLeaveRoom(ws, message.data.roomId);
            break;

          case 'message':
            broadcastToRoom(ws.roomId!, {
              type: 'message',
              data: message.data,
              userId: ws.userId,
              username: ws.username,
              timestamp: new Date().toISOString(),
            });
            break;

          case 'video_sync':
            broadcastToRoom(ws.roomId!, {
              type: 'video_sync',
              data: message.data,
              userId: ws.userId,
              username: ws.username,
              timestamp: new Date().toISOString(),
            }, ws);
            break;

          case 'mode_changed':
            broadcastToRoom(ws.roomId!, {
              type: 'mode_changed',
              data: message.data,
              userId: ws.userId,
              username: ws.username,
              timestamp: new Date().toISOString(),
            });
            break;

          case 'ownership_transferred':
            broadcastToRoom(ws.roomId!, {
              type: 'ownership_transferred',
              data: message.data,
              userId: ws.userId,
              username: ws.username,
              timestamp: new Date().toISOString(),
            });
            break;

          case 'room_updated':
            broadcastToRoom(ws.roomId!, {
              type: 'room_updated',
              data: message.data,
              userId: ws.userId,
              username: ws.username,
              timestamp: new Date().toISOString(),
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      if (ws.roomId) {
        handleLeaveRoom(ws, ws.roomId);
      }
      console.log(`WebSocket disconnected: ${ws.username} (${ws.userId})`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('✅ WebSocket server initialized on path /ws');
  return wss;
}

function handleJoinRoom(ws: AuthenticatedWebSocket, roomId: string) {
  // Leave previous room if any
  if (ws.roomId) {
    handleLeaveRoom(ws, ws.roomId);
  }

  ws.roomId = roomId;

  // Add to room connections
  if (!roomConnections.has(roomId)) {
    roomConnections.set(roomId, new Set());
  }
  roomConnections.get(roomId)!.add(ws);

  console.log(`${ws.username} joined room ${roomId}`);

  // Notify others in the room
  broadcastToRoom(roomId, {
    type: 'user_joined',
    data: {
      userId: ws.userId,
      username: ws.username,
    },
    timestamp: new Date().toISOString(),
  }, ws);
}

function handleLeaveRoom(ws: AuthenticatedWebSocket, roomId: string) {
  const roomClients = roomConnections.get(roomId);
  if (roomClients) {
    roomClients.delete(ws);
    if (roomClients.size === 0) {
      roomConnections.delete(roomId);
    }
  }

  console.log(`${ws.username} left room ${roomId}`);

  // Notify others in the room
  broadcastToRoom(roomId, {
    type: 'user_left',
    data: {
      userId: ws.userId,
      username: ws.username,
    },
    timestamp: new Date().toISOString(),
  });

  ws.roomId = undefined;
}

function broadcastToRoom(roomId: string, message: WSMessage, excludeClient?: AuthenticatedWebSocket) {
  const roomClients = roomConnections.get(roomId);
  if (!roomClients) return;

  const messageStr = JSON.stringify(message);

  roomClients.forEach((client) => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}
