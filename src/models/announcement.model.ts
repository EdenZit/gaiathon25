import { Schema, model, Document, Types } from 'mongoose';
import { z } from 'zod';

export const AnnouncementCategoryEnum = {
  GENERAL: 'general',
  TEAM: 'team',
  PROJECT: 'project',
  EVENT: 'event',
  MAINTENANCE: 'maintenance',
  SECURITY: 'security',
} as const;

export const AnnouncementPriorityEnum = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export interface IComment extends Document {
  content: string;
  author: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  reactions: {
    type: string;
    users: Types.ObjectId[];
  }[];
}

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  category: keyof typeof AnnouncementCategoryEnum;
  priority: keyof typeof AnnouncementPriorityEnum;
  author: Types.ObjectId;
  team?: Types.ObjectId;
  project?: Types.ObjectId;
  targetAudience: {
    teams?: Types.ObjectId[];
    roles?: string[];
    members?: Types.ObjectId[];
  };
  validFrom: Date;
  validUntil?: Date;
  isArchived: boolean;
  isPinned: boolean;
  attachments: {
    name: string;
    url: string;
    type: string;
  }[];
  comments: IComment[];
  readBy: {
    member: Types.ObjectId;
    readAt: Date;
  }[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    reactions: [{
      type: { type: String },
      users: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
    }],
  },
  { timestamps: true }
);

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: Object.keys(AnnouncementCategoryEnum),
    },
    priority: {
      type: String,
      required: true,
      enum: Object.keys(AnnouncementPriorityEnum),
      default: 'MEDIUM',
    },
    author: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team' },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    targetAudience: {
      teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
      roles: [String],
      members: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
    },
    validFrom: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date },
    isArchived: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    attachments: [{
      name: String,
      url: String,
      type: String,
    }],
    comments: [commentSchema],
    readBy: [{
      member: { type: Schema.Types.ObjectId, ref: 'Member' },
      readAt: { type: Date, default: Date.now },
    }],
    metadata: { type: Map, of: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
announcementSchema.index({ category: 1 });
announcementSchema.index({ priority: 1 });
announcementSchema.index({ team: 1 });
announcementSchema.index({ project: 1 });
announcementSchema.index({ validFrom: 1, validUntil: 1 });
announcementSchema.index({ isArchived: 1 });
announcementSchema.index({ isPinned: 1 });
announcementSchema.index({ 'targetAudience.teams': 1 });
announcementSchema.index({ 'targetAudience.roles': 1 });
announcementSchema.index({ 'targetAudience.members': 1 });
announcementSchema.index({ createdAt: 1 });

// Full-text search index
announcementSchema.index({ title: 'text', content: 'text' });

// Validation schema for announcement creation/updates
export const announcementValidationSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  category: z.enum(Object.keys(AnnouncementCategoryEnum) as [string, ...string[]]),
  priority: z.enum(Object.keys(AnnouncementPriorityEnum) as [string, ...string[]]),
  team: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  project: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  targetAudience: z.object({
    teams: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    roles: z.array(z.string()).optional(),
    members: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  }),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime().optional(),
  isPinned: z.boolean().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
  })).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Validation schema for comments
export const commentValidationSchema = z.object({
  content: z.string().min(1).max(1000),
});

export const Announcement = model<IAnnouncement>('Announcement', announcementSchema); 