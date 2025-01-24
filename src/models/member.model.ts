import mongoose, { Document, Model, Schema } from 'mongoose';
import { User } from './user.model';
import { Team } from './team.model';
import { Project } from './project.model';

export interface MemberActivity {
  type: 'PROJECT_CONTRIBUTION' | 'TASK_COMPLETION' | 'CODE_REVIEW' | 'DOCUMENTATION' | 'MEETING_ATTENDANCE';
  project?: Project['_id'];
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
  team: Team['_id'];
  invitedBy: User['_id'];
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  token: string;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface Member extends Document {
  user: User['_id'];
  team: Team['_id'];
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
  joinedAt: Date;
  lastActive: Date;
  
  // Virtual fields
  isOnline: boolean;
  productivityScore: number;
  collaborationScore: number;
  
  // Methods
  recordActivity(activity: Omit<MemberActivity, 'timestamp'>): Promise<Member>;
  updateMetrics(metrics: Omit<MemberMetrics, 'timestamp'>): Promise<Member>;
  sendInvitation(invitation: Omit<MemberInvitation, 'status' | 'token' | 'expiresAt'>): Promise<MemberInvitation>;
  updatePermissions(permissions: MemberPermission[]): Promise<Member>;
  calculateScores(): { productivity: number; collaboration: number; quality: number };
}

const memberSchema = new Schema<Member>(
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
      default: 'ACTIVE'
    },
    permissions: [{
      resource: {
        type: String,
        enum: ['PROJECT', 'TEAM', 'CODE', 'DEPLOYMENT', 'SETTINGS'],
        required: true
      },
      actions: [{
        type: String,
        enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE']
      }],
      conditions: Schema.Types.Mixed
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
        metadata: Schema.Types.Mixed
      }
    }],
    metrics: [{
      type: {
        type: String,
        enum: ['PRODUCTIVITY', 'COLLABORATION', 'QUALITY', 'ENGAGEMENT'],
        required: true
      },
      value: {
        type: Number,
        required: true
      },
      period: {
        type: String,
        enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      metadata: Schema.Types.Mixed
    }],
    invitations: [{
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
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
      token: {
        type: String,
        required: true
      },
      expiresAt: {
        type: Date,
        required: true
      },
      metadata: Schema.Types.Mixed
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
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastActive: {
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
memberSchema.virtual('isOnline').get(function(this: Member) {
  const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  return (new Date().getTime() - this.lastActive.getTime()) < ONLINE_THRESHOLD;
});

memberSchema.virtual('productivityScore').get(function(this: Member) {
  return this.calculateScores().productivity;
});

memberSchema.virtual('collaborationScore').get(function(this: Member) {
  return this.calculateScores().collaboration;
});

// Methods
memberSchema.methods.recordActivity = async function(
  activity: Omit<MemberActivity, 'timestamp'>
): Promise<Member> {
  this.activities.push({
    ...activity,
    timestamp: new Date()
  });
  this.lastActive = new Date();
  return this.save();
};

memberSchema.methods.updateMetrics = async function(
  metrics: Omit<MemberMetrics, 'timestamp'>
): Promise<Member> {
  this.metrics.push({
    ...metrics,
    timestamp: new Date()
  });
  return this.save();
};

memberSchema.methods.sendInvitation = async function(
  invitation: Omit<MemberInvitation, 'status' | 'token' | 'expiresAt'>
): Promise<MemberInvitation> {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const newInvitation = {
    ...invitation,
    status: 'PENDING' as const,
    token,
    expiresAt
  };

  this.invitations.push(newInvitation);
  await this.save();
  return newInvitation;
};

memberSchema.methods.updatePermissions = async function(
  permissions: MemberPermission[]
): Promise<Member> {
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
  const recentActivities = this.activities.filter(
    a => (now.getTime() - a.timestamp.getTime()) < THIRTY_DAYS
  );

  const productivity = recentActivities.reduce((sum, activity) => {
    if (['PROJECT_CONTRIBUTION', 'TASK_COMPLETION'].includes(activity.type)) {
      return sum + activity.details.impact;
    }
    return sum;
  }, 0) / Math.max(1, recentActivities.length);

  const collaboration = recentActivities.reduce((sum, activity) => {
    if (['CODE_REVIEW', 'MEETING_ATTENDANCE'].includes(activity.type)) {
      return sum + activity.details.impact;
    }
    return sum;
  }, 0) / Math.max(1, recentActivities.length);

  const quality = recentActivities.reduce((sum, activity) => {
    if (['CODE_REVIEW', 'DOCUMENTATION'].includes(activity.type)) {
      return sum + activity.details.impact;
    }
    return sum;
  }, 0) / Math.max(1, recentActivities.length);

  return {
    productivity: Math.round(productivity * 10) / 10,
    collaboration: Math.round(collaboration * 10) / 10,
    quality: Math.round(quality * 10) / 10
  };
};

export const MemberModel: Model<Member> = mongoose.models.Member || 
  mongoose.model<Member>('Member', memberSchema); 