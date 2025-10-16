import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipant {
  userId: string;
  username: string;
  joinedAt: Date;
}

export interface IRoom extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  ownerUsername: string;
  mode: 'screenshare' | 'watchparty';
  videoUrl?: string;
  participants: IParticipant[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const RoomSchema = new Schema<IRoom>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ownerUsername: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    enum: ['screenshare', 'watchparty'],
    default: 'watchparty',
  },
  videoUrl: {
    type: String,
    default: '',
  },
  participants: [ParticipantSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
