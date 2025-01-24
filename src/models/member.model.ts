import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { type User } from './user.model';
import { type Team } from './team.model';
import { type Project } from './project.model';

export interface MemberActivity {
  type: 'PROJECT_CONTRIBUTION' | 'TASK_COMPLETION' | 'CODE_REVIEW' | 'DOCUMENTATION' | 'MEETING_ATTENDANCE';
  project?: Types.ObjectId;
  timestamp: Date;
  details: {
    action: string;
    impact: number; // 1-10 scale
    duration?: number; // in minutes
    metadata?: Record<string, any>;
  };
}

export interface MemberMetrics {
  type: 'PRODUCTIVITY' | 'COLLABORATION' | 'QUALITY' | 'ENGAGEMENT';
  value: number;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface MemberPermission {
  resource: 'PROJECT' | 'TEAM' | 'CODE' | 'DEPLOYMENT' | 'SETTINGS';
  actions: ('CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'MANAGE')[];
  conditions?: Record<string, any>;
}

export interface MemberInvitation {
  email: string;
  role: 'LEADER' | 'MEMBER';
  team: Types.ObjectId;
  invitedBy: Types.ObjectId;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  token: string;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface IMember {
  user: Types.ObjectId;
  team: Types.ObjectId;
  role: 'LEADER' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  permissions: MemberPermission[];
  activities: MemberActivity[];
  metrics: MemberMetrics[];
  invitations: MemberInvitation[];
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      digest: 'NONE' | 'DAILY' | 'WEEKLY';
    };
    visibility: {
      profile: 'PUBLIC' | 'TEAM' | 'PRIVATE';
      activity: 'PUBLIC' | 'TEAM' | 'PRIVATE';
      metrics: 'PUBLIC' | 'TEAM' | 'PRIVATE';
    };
  };
  lastActive: Date;
  joinedAt: Date;
}

export interface IMemberMethods {
  sendInvitation(invitation: Omit<MemberInvitation, 'status' | 'token' | 'expiresAt'>): Promise<MemberInvitation>;
  updatePermissions(permissions: MemberPermission[]): Promise<MemberDocument>;
  recordActivity(activity: Omit<MemberActivity, 'timestamp'>): Promise<MemberDocument>;
  updateMetrics(metrics: Omit<MemberMetrics, 'timestamp'>): Promise<MemberDocument>;
  calculateScores(): { productivity: number; collaboration: number; quality: number; };
}

export type MemberDocument = Document<Types.ObjectId, {}, IMember> & 
  IMember & 
  IMemberMethods & {
    _id: Types.ObjectId;
  };

export type MemberModel = Model<IMember, {}, IMemberMethods>;

const memberSchema = new Schema<IMember, MemberModel, IMemberMethods>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    role: {
      type: String,
      enum: ['LEADER', 'MEMBER'],
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'INACTIVE'
    },
    permissions: [{
      resource: {
        type: String,
        enum: ['PROJECT', 'TEAM', 'CODE', 'DEPLOYMENT', 'SETTINGS'],
        required: true
      },
      actions: [{
        type: String,
        enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'],
        required: true
      }],
      conditions: {
        type: Map,
        of: Schema.Types.Mixed,
        default: () => new Map()
      }
    }],
    activities: [{
      type: {
        type: String,
        enum: ['PROJECT_CONTRIBUTION', 'TASK_COMPLETION', 'CODE_REVIEW', 'DOCUMENTATION', 'MEETING_ATTENDANCE'],
        required: true
      },
      project: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      details: {
        action: String,
        impact: {
          type: Number,
          min: 1,
          max: 10
        },
        duration: Number,
        metadata: {
          type: Map,
          of: Schema.Types.Mixed,
          default: () => new Map()
        }
      }
    }],
    metrics: [{
      type: {
        type: String,
        enum: ['PRODUCTIVITY', 'COLLABORATION', 'QUALITY', 'ENGAGEMENT'],
        required: true
      },
      value: Number,
      period: {
        type: String,
        enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      metadata: {
        type: Map,
        of: Schema.Types.Mixed,
        default: () => new Map()
      }
    }],
    invitations: [{
      email: {
        type: String,
        required: true,
        lowercase: true
      },
      role: {
        type: String,
        enum: ['LEADER', 'MEMBER'],
        required: true
      },
      team: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
      },
      invitedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
        default: 'PENDING'
      },
      token: String,
      expiresAt: Date,
      metadata: {
        type: Map,
        of: Schema.Types.Mixed,
        default: () => new Map()
      }
    }],
    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        push: {
          type: Boolean,
          default: true
        },
        digest: {
          type: String,
          enum: ['NONE', 'DAILY', 'WEEKLY'],
          default: 'DAILY'
        }
      },
      visibility: {
        profile: {
          type: String,
          enum: ['PUBLIC', 'TEAM', 'PRIVATE'],
          default: 'TEAM'
        },
        activity: {
          type: String,
          enum: ['PUBLIC', 'TEAM', 'PRIVATE'],
          default: 'TEAM'
        },
        metrics: {
          type: String,
          enum: ['PUBLIC', 'TEAM', 'PRIVATE'],
          default: 'TEAM'
        }
      }
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes
memberSchema.index({ user: 1, team: 1 }, { unique: true });
memberSchema.index({ 'invitations.email': 1 });
memberSchema.index({ 'invitations.token': 1 });
memberSchema.index({ lastActive: -1 });
memberSchema.index({ role: 1, status: 1 });

// Virtual fields
memberSchema.virtual('isOnline').get(function(this: MemberDocument) {
  const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  return (new Date().getTime() - this.lastActive.getTime()) < ONLINE_THRESHOLD;
});

memberSchema.virtual('productivityScore').get(function(this: MemberDocument) {
  return this.calculateScores().productivity;
});

memberSchema.virtual('collaborationScore').get(function(this: MemberDocument) {
  return this.calculateScores().collaboration;
});

// Methods
memberSchema.methods.sendInvitation = async function(
  invitation: Omit<MemberInvitation, 'status' | 'token' | 'expiresAt'>
): Promise<MemberInvitation> {
  const token = Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const newInvitation: MemberInvitation = {
    ...invitation,
    status: 'PENDING',
    token,
    expiresAt
  };

  this.invitations.push(newInvitation);
  await this.save();

  return newInvitation;
};

memberSchema.methods.recordActivity = async function(
  activity: Omit<MemberActivity, 'timestamp'>
): Promise<MemberDocument> {
  this.activities.push({
    ...activity,
    timestamp: new Date()
  });
  this.lastActive = new Date();
  return this.save();
};

memberSchema.methods.updateMetrics = async function(
  metrics: Omit<MemberMetrics, 'timestamp'>
): Promise<MemberDocument> {
  this.metrics.push({
    ...metrics,
    timestamp: new Date()
  });
  return this.save();
};

memberSchema.methods.updatePermissions = async function(
  permissions: MemberPermission[]
): Promise<MemberDocument> {
  this.permissions = permissions;
  return this.save();
};

memberSchema.methods.calculateScores = function(): {
  productivity: number;
  collaboration: number;
  quality: number;
} {
  const now = new Date();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  // Get activities from last 30 days
  const recentActivities = this.activities.filter(
    (a: MemberActivity) => (now.getTime() - a.timestamp.getTime()) < THIRTY_DAYS
  );

  // Calculate productivity score
  const productivityScore = recentActivities.reduce(
    (sum: number, activity: MemberActivity) => 
      activity.type === 'PROJECT_CONTRIBUTION' || activity.type === 'TASK_COMPLETION'
        ? sum + activity.details.impact
        : sum,
    0
  );

  // Calculate collaboration score
  const collaborationScore = recentActivities.reduce(
    (sum: number, activity: MemberActivity) => 
      activity.type === 'CODE_REVIEW' || activity.type === 'MEETING_ATTENDANCE'
        ? sum + activity.details.impact
        : sum,
    0
  );

  // Calculate quality score
  const qualityScore = recentActivities.reduce(
    (sum: number, activity: MemberActivity) => 
      activity.type === 'CODE_REVIEW' || activity.type === 'DOCUMENTATION'
        ? sum + activity.details.impact
        : sum,
    0
  );

  const activityCount = recentActivities.length || 1;

  return {
    productivity: Math.round((productivityScore / activityCount) * 10) / 10,
    collaboration: Math.round((collaborationScore / activityCount) * 10) / 10,
    quality: Math.round((qualityScore / activityCount) * 10) / 10
  };
};

export const MemberModel = (mongoose.models.Member as MemberModel) || 
  mongoose.model<IMember, MemberModel>('Member', memberSchema); 