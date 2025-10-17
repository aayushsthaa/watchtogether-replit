import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, param } from "express-validator";
import { User } from "./models/User";
import { Room } from "./models/Room";
import { authenticateToken, AuthRequest } from "./middleware/auth";
import { broadcastPlaylistUpdate } from "./websocket";
import { requireAdmin } from "./middleware/admin";
import { validateRequest } from "./middleware/validateRequest";

const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ==================== AUTH ROUTES ====================
  
  // POST /api/auth/login - Login user
  app.post(
    '/api/auth/login',
    [
      body('username').notEmpty().withMessage('Username is required'),
      body('password').notEmpty().withMessage('Password is required'),
    ],
    validateRequest,
    async (req, res) => {
      try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
          {
            _id: user._id.toString(),
            username: user.username,
            isAdmin: user.isAdmin,
            avatarUrl: user.avatarUrl || '',
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
          token,
          user: {
            _id: user._id.toString(),
            username: user.username,
            isAdmin: user.isAdmin,
            avatarUrl: user.avatarUrl || '',
          },
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // POST /api/auth/logout - Logout user
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  });

  // GET /api/auth/me - Get current user
  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await User.findById(req.user?._id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        _id: user._id.toString(),
        username: user.username,
        isAdmin: user.isAdmin,
        avatarUrl: user.avatarUrl || '',
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ==================== USER PROFILE ROUTES ====================

  // PATCH /api/profile - Update own profile
  app.patch(
    '/api/profile',
    authenticateToken,
    [
      body('username').optional().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
      body('avatarUrl').optional().custom((value) => {
        if (!value || value === '') return true;
        
        // Check if it's a base64 image
        if (value.startsWith('data:image/')) {
          const matches = value.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/);
          if (!matches) return false;
          
          // Check size (base64 adds ~33% overhead, so ~2.7MB base64 = ~2MB image)
          const base64Length = matches[2].length;
          const sizeInBytes = (base64Length * 3) / 4;
          const sizeInMB = sizeInBytes / (1024 * 1024);
          if (sizeInMB > 2.5) return false;
          
          return true;
        }
        
        // Legacy: Also accept regular URLs
        return /^https?:\/\/.+/.test(value);
      }).withMessage('Invalid image format or size. Must be a valid image (jpg, png, gif, webp) under 2MB'),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const updates: any = {};

        if (req.body.username) {
          const existingUser = await User.findOne({ 
            username: req.body.username, 
            _id: { $ne: req.user?._id } 
          });
          if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
          }
          updates.username = req.body.username;
        }

        if (req.body.avatarUrl !== undefined) {
          updates.avatarUrl = req.body.avatarUrl;
        }

        const user = await User.findByIdAndUpdate(req.user?._id, updates, { new: true }).select('-password');
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({
          _id: user._id.toString(),
          username: user.username,
          isAdmin: user.isAdmin,
          avatarUrl: user.avatarUrl || '',
        });
      } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // PATCH /api/profile/password - Change own password
  app.patch(
    '/api/profile/password',
    authenticateToken,
    [
      body('currentPassword').notEmpty().withMessage('Current password is required'),
      body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const user = await User.findById(req.user?._id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const isValidPassword = await bcrypt.compare(req.body.currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = await bcrypt.hash(req.body.newPassword, SALT_ROUNDS);
        await user.save();

        res.json({ message: 'Password updated successfully' });
      } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // ==================== ADMIN USER MANAGEMENT ROUTES ====================

  // GET /api/admin/users - Get all users (admin only)
  app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // POST /api/admin/users - Create new user (admin only)
  app.post(
    '/api/admin/users',
    authenticateToken,
    requireAdmin,
    [
      body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
      body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
      body('isAdmin').optional().isBoolean().withMessage('isAdmin must be a boolean'),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const { username, password, isAdmin } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const user = new User({
          username,
          password: hashedPassword,
          isAdmin: isAdmin || false,
        });

        await user.save();

        res.status(201).json({
          _id: user._id.toString(),
          username: user.username,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
        });
      } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // PATCH /api/admin/users/:id - Update user (admin only)
  app.patch(
    '/api/admin/users/:id',
    authenticateToken,
    requireAdmin,
    [
      param('id').isMongoId().withMessage('Invalid user ID'),
      body('username').optional().isLength({ min: 3, max: 30 }),
      body('password').optional().isLength({ min: 6 }),
      body('isAdmin').optional().isBoolean(),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const updates: any = {};

        if (req.body.username) {
          const existingUser = await User.findOne({ 
            username: req.body.username, 
            _id: { $ne: id } 
          });
          if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
          }
          updates.username = req.body.username;
        }

        if (req.body.password) {
          updates.password = await bcrypt.hash(req.body.password, SALT_ROUNDS);
        }

        if (req.body.isAdmin !== undefined) {
          updates.isAdmin = req.body.isAdmin;
        }

        const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
      } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // DELETE /api/admin/users/:id - Delete user (admin only)
  app.delete(
    '/api/admin/users/:id',
    authenticateToken,
    requireAdmin,
    [param('id').isMongoId().withMessage('Invalid user ID')],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
      } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // ==================== ROOM ROUTES ====================

  // GET /api/rooms - Get all active rooms
  app.get('/api/rooms', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const rooms = await Room.find({ isActive: true }).sort({ createdAt: -1 });
      res.json(rooms);
    } catch (error) {
      console.error('Get rooms error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // GET /api/rooms/:id - Get room details
  app.get(
    '/api/rooms/:id',
    authenticateToken,
    [param('id').isMongoId().withMessage('Invalid room ID')],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const room = await Room.findById(req.params.id);
        if (!room) {
          return res.status(404).json({ message: 'Room not found' });
        }

        res.json(room);
      } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // POST /api/rooms - Create new room
  app.post(
    '/api/rooms',
    authenticateToken,
    [
      body('name').notEmpty().isLength({ max: 50 }).withMessage('Room name is required (max 50 chars)'),
      body('mode').optional().isIn(['screenshare', 'watchparty']),
      body('videoUrl').optional().custom((value) => {
        if (!value || value === '') return true;
        return /^https?:\/\/.+/.test(value);
      }).withMessage('Invalid video URL'),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const { name, mode, videoUrl } = req.body;

        const room = new Room({
          name,
          mode: mode || 'watchparty',
          videoUrl: videoUrl || '',
          ownerId: req.user?._id,
          ownerUsername: req.user?.username,
          participants: [{
            userId: req.user?._id,
            username: req.user?.username,
            joinedAt: new Date(),
          }],
          isActive: true,
        });

        await room.save();
        res.status(201).json(room);
      } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // PATCH /api/rooms/:id - Update room (owner only)
  app.patch(
    '/api/rooms/:id',
    authenticateToken,
    [
      param('id').isMongoId().withMessage('Invalid room ID'),
      body('name').optional().isLength({ min: 1, max: 50 }),
      body('mode').optional().isIn(['screenshare', 'watchparty']),
      body('videoUrl').optional().custom((value) => {
        if (value === '') return true;
        return /^https?:\/\/.+/.test(value);
      }),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const room = await Room.findById(req.params.id);
        if (!room) {
          return res.status(404).json({ message: 'Room not found' });
        }

        if (room.ownerId.toString() !== req.user?._id) {
          return res.status(403).json({ message: 'Only the room owner can update the room' });
        }

        // Prevent direct videoUrl updates when playlist is active
        if (req.body.videoUrl !== undefined && room.playlist && room.playlist.length > 0) {
          return res.status(400).json({ 
            message: 'Cannot update video URL when playlist is active. Please manage videos through the playlist.' 
          });
        }

        const updates: any = {};
        if (req.body.name) updates.name = req.body.name;
        if (req.body.mode) updates.mode = req.body.mode;
        if (req.body.videoUrl !== undefined) updates.videoUrl = req.body.videoUrl;

        const updatedRoom = await Room.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(updatedRoom);
      } catch (error) {
        console.error('Update room error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // POST /api/rooms/:id/join - Join room (with single room restriction)
  app.post(
    '/api/rooms/:id/join',
    authenticateToken,
    [param('id').isMongoId().withMessage('Invalid room ID')],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const room = await Room.findById(req.params.id);
        if (!room) {
          return res.status(404).json({ message: 'Room not found' });
        }

        const alreadyJoined = room.participants.some(
          p => p.userId === req.user?._id
        );

        if (!alreadyJoined) {
          // Single room restriction: Remove user from any other rooms first
          await Room.updateMany(
            { 'participants.userId': req.user?._id },
            { $pull: { participants: { userId: req.user?._id } } }
          );

          // Add user to the new room
          room.participants.push({
            userId: req.user?._id!,
            username: req.user?.username!,
            avatarUrl: req.user?.avatarUrl || '',
            joinedAt: new Date(),
          });
          await room.save();
        }

        res.json(room);
      } catch (error) {
        console.error('Join room error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // POST /api/rooms/:id/leave - Leave room
  app.post(
    '/api/rooms/:id/leave',
    authenticateToken,
    [param('id').isMongoId().withMessage('Invalid room ID')],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const room = await Room.findById(req.params.id);
        if (!room) {
          return res.status(404).json({ message: 'Room not found' });
        }

        room.participants = room.participants.filter(
          p => p.userId !== req.user?._id
        );

        await room.save();
        res.json(room);
      } catch (error) {
        console.error('Leave room error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // POST /api/rooms/:id/transfer - Transfer ownership
  app.post(
    '/api/rooms/:id/transfer',
    authenticateToken,
    [
      param('id').isMongoId().withMessage('Invalid room ID'),
      body('newOwnerId').isMongoId().withMessage('Invalid new owner ID'),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const room = await Room.findById(req.params.id);
        if (!room) {
          return res.status(404).json({ message: 'Room not found' });
        }

        if (room.ownerId.toString() !== req.user?._id) {
          return res.status(403).json({ message: 'Only the room owner can transfer ownership' });
        }

        const newOwner = await User.findById(req.body.newOwnerId);
        if (!newOwner) {
          return res.status(404).json({ message: 'New owner not found' });
        }

        room.ownerId = newOwner._id;
        room.ownerUsername = newOwner.username;
        await room.save();

        res.json(room);
      } catch (error) {
        console.error('Transfer ownership error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // DELETE /api/rooms/:id - Delete/close room (owner only)
  app.delete(
    '/api/rooms/:id',
    authenticateToken,
    [param('id').isMongoId().withMessage('Invalid room ID')],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const room = await Room.findById(req.params.id);
        if (!room) {
          return res.status(404).json({ message: 'Room not found' });
        }

        if (room.ownerId.toString() !== req.user?._id) {
          return res.status(403).json({ message: 'Only the room owner can delete the room' });
        }

        room.isActive = false;
        await room.save();

        res.json({ message: 'Room closed successfully' });
      } catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // ==================== PLAYLIST ROUTES ====================

  // POST /api/rooms/:id/playlist - Add video to playlist (owner only)
  app.post(
    '/api/rooms/:id/playlist',
    authenticateToken,
    [
      param('id').isMongoId().withMessage('Invalid room ID'),
      body('url').notEmpty().custom((value) => {
        if (!value || value === '') return false;
        return /^https?:\/\/.+/.test(value);
      }).withMessage('Valid URL is required'),
      body('title').optional().isString(),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const room = await Room.findById(req.params.id);
        if (!room) {
          return res.status(404).json({ message: 'Room not found' });
        }

        if (room.ownerId.toString() !== req.user?._id) {
          return res.status(403).json({ message: 'Only the room owner can manage the playlist' });
        }

        const newEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          url: req.body.url,
          title: req.body.title || 'Untitled',
          addedBy: req.user?._id!,
          addedByUsername: req.user?.username!,
          addedAt: new Date(),
        };

        room.playlist.push(newEntry);
        await room.save();

        // Broadcast playlist update to all room participants
        broadcastPlaylistUpdate(room._id.toString(), room);

        res.status(201).json(room);
      } catch (error) {
        console.error('Add to playlist error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // DELETE /api/rooms/:id/playlist/:entryId - Remove video from playlist (owner only)
  app.delete(
    '/api/rooms/:id/playlist/:entryId',
    authenticateToken,
    [
      param('id').isMongoId().withMessage('Invalid room ID'),
      param('entryId').notEmpty().withMessage('Entry ID is required'),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const room = await Room.findById(req.params.id);
        if (!room) {
          return res.status(404).json({ message: 'Room not found' });
        }

        if (room.ownerId.toString() !== req.user?._id) {
          return res.status(403).json({ message: 'Only the room owner can manage the playlist' });
        }

        const entryIndex = room.playlist.findIndex(e => e.id === req.params.entryId);
        if (entryIndex === -1) {
          return res.status(404).json({ message: 'Playlist entry not found' });
        }

        // If removing the currently playing video, adjust currentIndex
        if (entryIndex === room.currentIndex && room.playlist.length > 1) {
          // Keep currentIndex the same to play next video, but cap it
          room.currentIndex = Math.min(room.currentIndex, room.playlist.length - 2);
        } else if (entryIndex < room.currentIndex) {
          // Adjust index if removing earlier video
          room.currentIndex = Math.max(0, room.currentIndex - 1);
        }

        room.playlist.splice(entryIndex, 1);
        await room.save();

        // Broadcast playlist update to all room participants
        broadcastPlaylistUpdate(room._id.toString(), room);

        res.json(room);
      } catch (error) {
        console.error('Remove from playlist error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // PATCH /api/rooms/:id/playlist/next - Skip to next video (owner only)
  app.patch(
    '/api/rooms/:id/playlist/next',
    authenticateToken,
    [param('id').isMongoId().withMessage('Invalid room ID')],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const room = await Room.findById(req.params.id);
        if (!room) {
          return res.status(404).json({ message: 'Room not found' });
        }

        if (room.ownerId.toString() !== req.user?._id) {
          return res.status(403).json({ message: 'Only the room owner can control playback' });
        }

        if (room.playlist.length === 0) {
          return res.status(400).json({ message: 'Playlist is empty' });
        }

        room.currentIndex = (room.currentIndex + 1) % room.playlist.length;
        await room.save();

        // Broadcast playlist update to all room participants
        broadcastPlaylistUpdate(room._id.toString(), room);

        res.json(room);
      } catch (error) {
        console.error('Skip to next error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // PATCH /api/rooms/:id/playlist/previous - Go to previous video (owner only)
  app.patch(
    '/api/rooms/:id/playlist/previous',
    authenticateToken,
    [param('id').isMongoId().withMessage('Invalid room ID')],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const room = await Room.findById(req.params.id);
        if (!room) {
          return res.status(404).json({ message: 'Room not found' });
        }

        if (room.ownerId.toString() !== req.user?._id) {
          return res.status(403).json({ message: 'Only the room owner can control playback' });
        }

        if (room.playlist.length === 0) {
          return res.status(400).json({ message: 'Playlist is empty' });
        }

        room.currentIndex = room.currentIndex - 1;
        if (room.currentIndex < 0) {
          room.currentIndex = room.playlist.length - 1;
        }
        await room.save();

        // Broadcast playlist update to all room participants
        broadcastPlaylistUpdate(room._id.toString(), room);

        res.json(room);
      } catch (error) {
        console.error('Go to previous error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // ==================== MESSAGE ROUTES ====================
  // Messages are now stored in memory only (not persisted to MongoDB)
  const roomMessages = new Map<string, any[]>();

  // GET /api/rooms/:id/messages - Get chat history (from memory)
  app.get(
    '/api/rooms/:id/messages',
    authenticateToken,
    [param('id').isMongoId().withMessage('Invalid room ID')],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const messages = roomMessages.get(req.params.id) || [];
        res.json(messages);
      } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // POST /api/rooms/:id/messages - Send message (store in memory only)
  app.post(
    '/api/rooms/:id/messages',
    authenticateToken,
    [
      param('id').isMongoId().withMessage('Invalid room ID'),
      body('content').notEmpty().isLength({ max: 1000 }).withMessage('Message content is required (max 1000 chars)'),
      body('type').optional().isIn(['text', 'gif', 'system']),
      body('gifUrl').optional().isURL(),
    ],
    validateRequest,
    async (req: AuthRequest, res) => {
      try {
        const { content, type, gifUrl } = req.body;

        const message = {
          _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          roomId: req.params.id,
          userId: req.user?._id,
          username: req.user?.username,
          avatarUrl: req.user?.avatarUrl || '',
          content,
          type: type || 'text',
          gifUrl,
          createdAt: new Date().toISOString(),
        };

        // Store in memory
        if (!roomMessages.has(req.params.id)) {
          roomMessages.set(req.params.id, []);
        }
        const messages = roomMessages.get(req.params.id)!;
        messages.push(message);
        
        // Keep only last 100 messages per room
        if (messages.length > 100) {
          messages.shift();
        }

        res.status(201).json(message);
      } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
