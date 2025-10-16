import { z } from "zod";

// User Schema
export const userSchema = z.object({
  _id: z.string(),
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  isAdmin: z.boolean().default(false),
  avatarUrl: z.string().optional(),
  createdAt: z.date().or(z.string()),
});

export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isAdmin: z.boolean().optional().default(false),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

// Room Schema
export const roomModeSchema = z.enum(["screenshare", "watchparty"]);

export const participantSchema = z.object({
  userId: z.string(),
  username: z.string(),
  joinedAt: z.date().or(z.string()),
});

export const roomSchema = z.object({
  _id: z.string(),
  name: z.string(),
  ownerId: z.string(),
  ownerUsername: z.string(),
  mode: roomModeSchema,
  videoUrl: z.string().optional(),
  participants: z.array(participantSchema),
  isActive: z.boolean(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export const insertRoomSchema = z.object({
  name: z.string().min(1, "Room name is required").max(50),
  videoUrl: z.string().url().optional(),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  mode: roomModeSchema.optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  ownerId: z.string().optional(),
});

export type Room = z.infer<typeof roomSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type UpdateRoom = z.infer<typeof updateRoomSchema>;
export type RoomMode = z.infer<typeof roomModeSchema>;
export type Participant = z.infer<typeof participantSchema>;

// Message Schema
export const messageSchema = z.object({
  _id: z.string(),
  roomId: z.string(),
  userId: z.string(),
  username: z.string(),
  content: z.string(),
  type: z.enum(["text", "gif", "system"]),
  gifUrl: z.string().optional(),
  createdAt: z.date().or(z.string()),
});

export const insertMessageSchema = z.object({
  roomId: z.string(),
  content: z.string().min(1).max(1000),
  type: z.enum(["text", "gif", "system"]).optional().default("text"),
  gifUrl: z.string().url().optional(),
});

export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// WebSocket Event Types
export const wsEventSchema = z.object({
  type: z.enum([
    "message",
    "user_joined",
    "user_left",
    "mode_changed",
    "video_sync",
    "ownership_transferred",
    "room_updated",
  ]),
  data: z.any(),
  roomId: z.string().optional(),
  userId: z.string().optional(),
  timestamp: z.date().or(z.string()).optional(),
});

export type WSEvent = z.infer<typeof wsEventSchema>;

// Video Sync Event
export const videoSyncSchema = z.object({
  action: z.enum(["play", "pause", "seek"]),
  currentTime: z.number(),
  videoUrl: z.string().optional(),
});

export type VideoSync = z.infer<typeof videoSyncSchema>;

// Auth Response
export const authResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    _id: z.string(),
    username: z.string(),
    isAdmin: z.boolean(),
    avatarUrl: z.string().optional(),
  }),
});

// Profile Update Schema
export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  avatarUrl: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      // Check if it's a base64 image
      if (val.startsWith('data:image/')) {
        const matches = val.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/);
        if (!matches) return false;
        
        // Check size (base64 adds ~33% overhead, so ~2.7MB base64 = ~2MB image)
        const base64Length = matches[2].length;
        const sizeInBytes = (base64Length * 3) / 4;
        const sizeInMB = sizeInBytes / (1024 * 1024);
        return sizeInMB <= 2.5; // Allow up to 2.5MB to account for ~2MB images
      }
      // Legacy: Also accept regular URLs
      return /^https?:\/\/.+/.test(val);
    }, "Invalid image format or size. Must be a valid image (jpg, png, gif, webp) under 2MB"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;

export type AuthResponse = z.infer<typeof authResponseSchema>;
