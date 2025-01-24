import { Schema, model, Document, Types } from 'mongoose';
import { z } from 'zod';

export const EventPriorityEnum = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const EventStatusEnum = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DELAYED: 'delayed',
} as const;

export const EventTypeEnum = {
  TASK: 'task',
  MILESTONE: 'milestone',
  MEETING: 'meeting',
  DEADLINE: 'deadline',
  REVIEW: 'review',
} as const;

export interface IEvent extends Document {
  title: string;
  description: string;
  type: keyof typeof EventTypeEnum;
  startDate: Date;
  endDate: Date;
  priority: keyof typeof EventPriorityEnum;
  status: keyof typeof EventStatusEnum;
  project: Types.ObjectId;
  team: Types.ObjectId;
  assignees: Types.ObjectId[];
  parentEvent?: Types.ObjectId;
  subEvents: Types.ObjectId[];
  dependencies: Types.ObjectId[];
  location?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  reminders: {
    type: 'email' | 'notification';
    time: number; // minutes before event
  }[];
  attachments: {
    name: string;
    url: string;
    type: string;
  }[];
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { 
      type: String, 
      required: true,
      enum: Object.keys(EventTypeEnum),
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    priority: {
      type: String,
      required: true,
      enum: Object.keys(EventPriorityEnum),
      default: 'MEDIUM',
    },
    status: {
      type: String,
      required: true,
      enum: Object.keys(EventStatusEnum),
      default: 'SCHEDULED',
    },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    assignees: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
    parentEvent: { type: Schema.Types.ObjectId, ref: 'Event' },
    subEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
    dependencies: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
    location: { type: String },
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: { type: String },
    reminders: [{
      type: { type: String, enum: ['email', 'notification'] },
      time: Number,
    }],
    attachments: [{
      name: String,
      url: String,
      type: String,
    }],
    tags: [String],
    metadata: { type: Map, of: Schema.Types.Mixed },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
eventSchema.index({ project: 1, startDate: 1 });
eventSchema.index({ team: 1, startDate: 1 });
eventSchema.index({ assignees: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ type: 1 });

// Validation schema for event creation/updates
export const eventValidationSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  type: z.enum(Object.values(EventTypeEnum) as [string, ...string[]]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  priority: z.enum(Object.values(EventPriorityEnum) as [string, ...string[]]),
  status: z.enum(Object.values(EventStatusEnum) as [string, ...string[]]),
  project: z.string().regex(/^[0-9a-fA-F]{24}$/),
  team: z.string().regex(/^[0-9a-fA-F]{24}$/),
  assignees: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)),
  parentEvent: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  location: z.string().optional(),
  isRecurring: z.boolean(),
  recurrencePattern: z.string().optional(),
  reminders: z.array(z.object({
    type: z.enum(['email', 'notification']),
    time: z.number().min(0),
  })),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
  })),
  tags: z.array(z.string()),
  metadata: z.record(z.unknown()),
});

export const Event = model<IEvent>('Event', eventSchema); 