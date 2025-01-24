import { Schema, model, Document, Types } from 'mongoose';
import { z } from 'zod';

export const TimelineViewEnum = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  CUSTOM: 'custom',
} as const;

export interface ITimeline extends Document {
  title: string;
  description: string;
  project: Types.ObjectId;
  team: Types.ObjectId;
  events: Types.ObjectId[];
  startDate: Date;
  endDate: Date;
  defaultView: keyof typeof TimelineViewEnum;
  filters: {
    types?: string[];
    tags?: string[];
    assignees?: Types.ObjectId[];
    priority?: string[];
    status?: string[];
  };
  customViews: {
    name: string;
    filters: {
      types?: string[];
      tags?: string[];
      assignees?: Types.ObjectId[];
      priority?: string[];
      status?: string[];
    };
    view: keyof typeof TimelineViewEnum;
    isDefault: boolean;
  }[];
  settings: {
    showWeekends: boolean;
    workingHours: {
      start: string;
      end: string;
    };
    timeZone: string;
    reminderDefaults: {
      type: 'email' | 'notification';
      time: number;
    }[];
  };
  exportHistory: {
    format: 'pdf' | 'csv' | 'ical';
    url: string;
    createdAt: Date;
    createdBy: Types.ObjectId;
  }[];
  metadata: Record<string, unknown>;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const timelineSchema = new Schema<ITimeline>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    events: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    defaultView: {
      type: String,
      enum: Object.keys(TimelineViewEnum),
      default: 'MONTH',
    },
    filters: {
      types: [String],
      tags: [String],
      assignees: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
      priority: [String],
      status: [String],
    },
    customViews: [{
      name: { type: String, required: true },
      filters: {
        types: [String],
        tags: [String],
        assignees: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
        priority: [String],
        status: [String],
      },
      view: { type: String, enum: Object.keys(TimelineViewEnum) },
      isDefault: { type: Boolean, default: false },
    }],
    settings: {
      showWeekends: { type: Boolean, default: true },
      workingHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '17:00' },
      },
      timeZone: { type: String, default: 'UTC' },
      reminderDefaults: [{
        type: { type: String, enum: ['email', 'notification'] },
        time: Number,
      }],
    },
    exportHistory: [{
      format: { type: String, enum: ['pdf', 'csv', 'ical'] },
      url: String,
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: Schema.Types.ObjectId, ref: 'Member' },
    }],
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
timelineSchema.index({ project: 1 });
timelineSchema.index({ team: 1 });
timelineSchema.index({ startDate: 1, endDate: 1 });
timelineSchema.index({ 'customViews.name': 1 });

// Validation schema for timeline creation/updates
export const timelineValidationSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  project: z.string().regex(/^[0-9a-fA-F]{24}$/),
  team: z.string().regex(/^[0-9a-fA-F]{24}$/),
  events: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  defaultView: z.enum(Object.keys(TimelineViewEnum) as [string, ...string[]]),
  filters: z.object({
    types: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    assignees: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    priority: z.array(z.string()).optional(),
    status: z.array(z.string()).optional(),
  }),
  customViews: z.array(z.object({
    name: z.string().min(1).max(50),
    filters: z.object({
      types: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      assignees: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
      priority: z.array(z.string()).optional(),
      status: z.array(z.string()).optional(),
    }),
    view: z.enum(Object.keys(TimelineViewEnum) as [string, ...string[]]),
    isDefault: z.boolean(),
  })),
  settings: z.object({
    showWeekends: z.boolean(),
    workingHours: z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }),
    timeZone: z.string(),
    reminderDefaults: z.array(z.object({
      type: z.enum(['email', 'notification']),
      time: z.number().min(0),
    })),
  }),
  metadata: z.record(z.unknown()),
});

export const Timeline = model<ITimeline>('Timeline', timelineSchema); 