import { Schema, model, Document, Types } from 'mongoose';
import { z } from 'zod';

export const NotificationTypeEnum = {
  ANNOUNCEMENT: 'announcement',
  EVENT: 'event',
  TASK: 'task',
  MENTION: 'mention',
  COMMENT: 'comment',
  TEAM: 'team',
  PROJECT: 'project',
  MILESTONE: 'milestone',
  SYSTEM: 'system',
} as const;

export const NotificationPriorityEnum = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const NotificationChannelEnum = {
  IN_APP: 'in-app',
  EMAIL: 'email',
  PUSH: 'push',
  SLACK: 'slack',
} as const;

export interface INotification extends Document {
  type: keyof typeof NotificationTypeEnum;
  priority: keyof typeof NotificationPriorityEnum;
  recipient: Types.ObjectId;
  sender?: Types.ObjectId;
  title: string;
  content: string;
  channels: (keyof typeof NotificationChannelEnum)[];
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  groupId?: string;
  groupCount?: number;
  relatedEntities: {
    type: string;
    id: Types.ObjectId;
  }[];
  deliveryStatus: {
    channel: keyof typeof NotificationChannelEnum;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: Date;
    error?: string;
  }[];
  expiresAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      required: true,
      enum: Object.keys(NotificationTypeEnum),
    },
    priority: {
      type: String,
      required: true,
      enum: Object.keys(NotificationPriorityEnum),
      default: 'MEDIUM',
    },
    recipient: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'Member' },
    title: { type: String, required: true },
    content: { type: String, required: true },
    channels: [{
      type: String,
      enum: Object.keys(NotificationChannelEnum),
      required: true,
    }],
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    actionUrl: { type: String },
    groupId: { type: String },
    groupCount: { type: Number, default: 1 },
    relatedEntities: [{
      type: { type: String, required: true },
      id: { type: Schema.Types.ObjectId, required: true, refPath: 'relatedEntities.type' },
    }],
    deliveryStatus: [{
      channel: { type: String, enum: Object.keys(NotificationChannelEnum) },
      status: { type: String, enum: ['pending', 'sent', 'failed'] },
      sentAt: { type: Date },
      error: { type: String },
    }],
    expiresAt: { type: Date },
    metadata: { type: Map, of: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ groupId: 1 });
notificationSchema.index({ 'relatedEntities.type': 1, 'relatedEntities.id': 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Validation schema for notification creation
export const notificationValidationSchema = z.object({
  type: z.enum(Object.keys(NotificationTypeEnum) as [string, ...string[]]),
  priority: z.enum(Object.keys(NotificationPriorityEnum) as [string, ...string[]]),
  recipient: z.string().regex(/^[0-9a-fA-F]{24}$/),
  sender: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  channels: z.array(z.enum(Object.keys(NotificationChannelEnum) as [string, ...string[]])),
  actionUrl: z.string().url().optional(),
  groupId: z.string().optional(),
  relatedEntities: z.array(z.object({
    type: z.string(),
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  })),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const Notification = model<INotification>('Notification', notificationSchema); 