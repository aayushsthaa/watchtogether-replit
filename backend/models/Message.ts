import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  roomId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  username: string;
  content: string;
  type: 'text' | 'gif' | 'system';
  gifUrl?: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ['text', 'gif', 'system'],
    default: 'text',
  },
  gifUrl: {
    type: String,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
