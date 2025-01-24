import mongoose, { Document, Model, Schema } from 'mongoose';
import { Team } from './team.model';
import { User } from './user.model';

export interface ProjectMilestone {
  title: string;
  description?: string;
  dueDate: Date;
  completedAt?: Date;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  progress: number;
  assignees: User['_id'][];
  tasks: {
    title: string;
    description?: string;
    completed: boolean;
    assignee?: User['_id'];
    dueDate?: Date;
  }[];
}

export interface ProjectEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'MEETING' | 'DEADLINE' | 'REVIEW' | 'OTHER';
  location?: string;
  attendees: User['_id'][];
  reminders: {
    type: 'EMAIL' | 'NOTIFICATION';
    time: number; // minutes before event
    sent: boolean;
  }[];
}

export interface ProjectMetrics {
  type: 'COMPLETION' | 'CONTRIBUTION' | 'ACTIVITY';
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Project extends Document {
  title: string;
  description?: string;
  team: Team['_id'];
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  startDate: Date;
  endDate: Date;
  milestones: ProjectMilestone[];
  events: ProjectEvent[];
  metrics: ProjectMetrics[];
  settings: {
    visibility: 'PUBLIC' | 'PRIVATE';
    allowComments: boolean;
    requireApproval: boolean;
    autoReminders: boolean;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  progress: number;
  daysRemaining: number;
  isOverdue: boolean;

  // Methods
  addMilestone(milestone: Omit<ProjectMilestone, 'progress' | 'status'>): Promise<Project>;
  updateMilestone(index: number, updates: Partial<ProjectMilestone>): Promise<Project>;
  addEvent(event: Omit<ProjectEvent, 'reminders'>): Promise<Project>;
  updateEvent(index: number, updates: Partial<ProjectEvent>): Promise<Project>;
  recordMetric(metric: Omit<ProjectMetrics, 'timestamp'>): Promise<Project>;
  calculateProgress(): number;
}

const projectSchema = new Schema<Project>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 1000
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    status: {
      type: String,
      enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'],
      default: 'PLANNING'
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(this: Project, value: Date) {
          return value > this.startDate;
        },
        message: 'End date must be after start date'
      }
    },
    milestones: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      description: String,
      dueDate: {
        type: Date,
        required: true
      },
      completedAt: Date,
      status: {
        type: String,
        enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'],
        default: 'NOT_STARTED'
      },
      progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      assignees: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      tasks: [{
        title: {
          type: String,
          required: true,
          trim: true
        },
        description: String,
        completed: {
          type: Boolean,
          default: false
        },
        assignee: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        dueDate: Date
      }]
    }],
    events: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      description: String,
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      type: {
        type: String,
        enum: ['MEETING', 'DEADLINE', 'REVIEW', 'OTHER'],
        default: 'OTHER'
      },
      location: String,
      attendees: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      reminders: [{
        type: {
          type: String,
          enum: ['EMAIL', 'NOTIFICATION'],
          required: true
        },
        time: {
          type: Number,
          required: true,
          min: 0
        },
        sent: {
          type: Boolean,
          default: false
        }
      }]
    }],
    metrics: [{
      type: {
        type: String,
        enum: ['COMPLETION', 'CONTRIBUTION', 'ACTIVITY'],
        required: true
      },
      value: {
        type: Number,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      metadata: Schema.Types.Mixed
    }],
    settings: {
      visibility: {
        type: String,
        enum: ['PUBLIC', 'PRIVATE'],
        default: 'PRIVATE'
      },
      allowComments: {
        type: Boolean,
        default: true
      },
      requireApproval: {
        type: Boolean,
        default: true
      },
      autoReminders: {
        type: Boolean,
        default: true
      }
    },
    tags: [String]
  },
  {
    timestamps: true
  }
);

// Indexes
projectSchema.index({ team: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });
projectSchema.index({ tags: 1 });

// Virtual fields
projectSchema.virtual('progress').get(function(this: Project) {
  return this.calculateProgress();
});

projectSchema.virtual('daysRemaining').get(function(this: Project) {
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

projectSchema.virtual('isOverdue').get(function(this: Project) {
  return this.daysRemaining < 0 && this.status !== 'COMPLETED';
});

// Methods
projectSchema.methods.addMilestone = async function(
  milestone: Omit<ProjectMilestone, 'progress' | 'status'>
): Promise<Project> {
  this.milestones.push({
    ...milestone,
    progress: 0,
    status: 'NOT_STARTED'
  });
  return this.save();
};

projectSchema.methods.updateMilestone = async function(
  index: number,
  updates: Partial<ProjectMilestone>
): Promise<Project> {
  if (index < 0 || index >= this.milestones.length) {
    throw new Error('Invalid milestone index');
  }

  const milestone = this.milestones[index];
  Object.assign(milestone, updates);

  if (updates.status === 'COMPLETED' && !milestone.completedAt) {
    milestone.completedAt = new Date();
    milestone.progress = 100;
  }

  if (milestone.tasks?.length) {
    const completedTasks = milestone.tasks.filter(t => t.completed).length;
    milestone.progress = (completedTasks / milestone.tasks.length) * 100;
  }

  await this.recordMetric({
    type: 'COMPLETION',
    value: milestone.progress,
    metadata: { milestoneIndex: index }
  });

  return this.save();
};

projectSchema.methods.addEvent = async function(
  event: Omit<ProjectEvent, 'reminders'>
): Promise<Project> {
  const defaultReminders = [
    { type: 'EMAIL' as const, time: 1440, sent: false }, // 24 hours before
    { type: 'NOTIFICATION' as const, time: 60, sent: false } // 1 hour before
  ];

  this.events.push({
    ...event,
    reminders: this.settings.autoReminders ? defaultReminders : []
  });
  return this.save();
};

projectSchema.methods.updateEvent = async function(
  index: number,
  updates: Partial<ProjectEvent>
): Promise<Project> {
  if (index < 0 || index >= this.events.length) {
    throw new Error('Invalid event index');
  }

  Object.assign(this.events[index], updates);
  return this.save();
};

projectSchema.methods.recordMetric = async function(
  metric: Omit<ProjectMetrics, 'timestamp'>
): Promise<Project> {
  this.metrics.push({
    ...metric,
    timestamp: new Date()
  });
  return this.save();
};

projectSchema.methods.calculateProgress = function(): number {
  if (!this.milestones.length) return 0;

  const totalProgress = this.milestones.reduce((sum, milestone) => {
    return sum + milestone.progress;
  }, 0);

  return Math.round(totalProgress / this.milestones.length);
};

export const ProjectModel: Model<Project> = mongoose.models.Project || 
  mongoose.model<Project>('Project', projectSchema); 