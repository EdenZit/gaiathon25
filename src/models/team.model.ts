import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { type User } from './user.model';

export interface TeamMember {
  user: Types.ObjectId;
  role: 'LEADER' | 'MEMBER';
  joinedAt: Date;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface TeamResource {
  type: 'STORAGE' | 'COMPUTE' | 'API_CALLS';
  allocated: number;
  used: number;
  lastUpdated: Date;
}

export interface TeamActivity {
  type: 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'ROLE_CHANGED' | 'RESOURCE_UPDATED' | 'SETTINGS_UPDATED';
  user: Types.ObjectId;
  timestamp: Date;
  details: Record<string, any>;
}

export interface ITeam {
  name: string;
  description?: string;
  members: TeamMember[];
  resources: TeamResource[];
  settings: {
    isOpen: boolean;
    requiresApproval: boolean;
    maxMembers: number;
    visibility: 'PUBLIC' | 'PRIVATE';
  };
  workspace: {
    repositoryUrl?: string;
    projectPath?: string;
    storageUsed: number;
  };
  activityLog: TeamActivity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeamMethods {
  addMember(userId: string, role?: 'LEADER' | 'MEMBER'): Promise<TeamDocument>;
  removeMember(userId: string): Promise<TeamDocument>;
  updateMemberRole(userId: string, newRole: 'LEADER' | 'MEMBER'): Promise<TeamDocument>;
  updateResources(type: TeamResource['type'], used: number): Promise<TeamDocument>;
  logActivity(activity: Omit<TeamActivity, 'timestamp'>): Promise<TeamDocument>;
}

export interface ITeamVirtuals {
  memberCount: number;
  isAtCapacity: boolean;
}

export type TeamDocument = Document<Types.ObjectId, {}, ITeam> & 
  ITeam & 
  ITeamMethods & 
  ITeamVirtuals & {
    _id: Types.ObjectId;
  };

export type TeamModel = Model<ITeam, {}, ITeamMethods>;

const teamSchema = new Schema<ITeam, TeamModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9-_]+$/
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    members: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['LEADER', 'MEMBER'],
        required: true
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
      }
    }],
    resources: [{
      type: {
        type: String,
        enum: ['STORAGE', 'COMPUTE', 'API_CALLS'],
        required: true
      },
      allocated: {
        type: Number,
        required: true
      },
      used: {
        type: Number,
        default: 0
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    }],
    settings: {
      isOpen: {
        type: Boolean,
        default: false
      },
      requiresApproval: {
        type: Boolean,
        default: true
      },
      maxMembers: {
        type: Number,
        min: 2,
        max: 4,
        default: 4
      },
      visibility: {
        type: String,
        enum: ['PUBLIC', 'PRIVATE'],
        default: 'PUBLIC'
      }
    },
    workspace: {
      repositoryUrl: String,
      projectPath: String,
      storageUsed: {
        type: Number,
        default: 0
      }
    },
    activityLog: [{
      type: {
        type: String,
        enum: ['MEMBER_JOINED', 'MEMBER_LEFT', 'ROLE_CHANGED', 'RESOURCE_UPDATED', 'SETTINGS_UPDATED'],
        required: true
      },
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      details: {
        type: Map,
        of: Schema.Types.Mixed,
        default: () => new Map()
      }
    }]
  },
  {
    timestamps: true,
    virtuals: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
teamSchema.index({ name: 1 }, { unique: true });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ 'settings.visibility': 1 });
teamSchema.index({ createdAt: -1 });

// Virtual fields
teamSchema.virtual('memberCount').get(function(this: TeamDocument) {
  return this.members.filter(m => m.status === 'ACTIVE').length;
});

teamSchema.virtual('isAtCapacity').get(function(this: TeamDocument) {
  return this.memberCount >= this.settings.maxMembers;
});

// Methods
teamSchema.methods.addMember = async function(
  userId: string,
  role: 'LEADER' | 'MEMBER' = 'MEMBER'
): Promise<TeamDocument> {
  if (this.isAtCapacity) {
    throw new Error('Team is at maximum capacity');
  }

  const existingMember = this.members.find(m => 
    m.user.toString() === userId && m.status === 'ACTIVE'
  );

  if (existingMember) {
    throw new Error('User is already an active member');
  }

  this.members.push({
    user: new Types.ObjectId(userId),
    role,
    joinedAt: new Date(),
    status: 'ACTIVE'
  });

  await this.logActivity({
    type: 'MEMBER_JOINED',
    user: new Types.ObjectId(userId),
    details: { role }
  });

  return this.save();
};

teamSchema.methods.removeMember = async function(
  userId: string
): Promise<TeamDocument> {
  const member = this.members.find(m => 
    m.user.toString() === userId && m.status === 'ACTIVE'
  );

  if (!member) {
    throw new Error('Member not found');
  }

  member.status = 'INACTIVE';

  await this.logActivity({
    type: 'MEMBER_LEFT',
    user: new Types.ObjectId(userId),
    details: { role: member.role }
  });

  return this.save();
};

teamSchema.methods.updateMemberRole = async function(
  userId: string,
  newRole: 'LEADER' | 'MEMBER'
): Promise<TeamDocument> {
  const member = this.members.find(m => 
    m.user.toString() === userId && m.status === 'ACTIVE'
  );

  if (!member) {
    throw new Error('Member not found');
  }

  const oldRole = member.role;
  member.role = newRole;

  await this.logActivity({
    type: 'ROLE_CHANGED',
    user: new Types.ObjectId(userId),
    details: { oldRole, newRole }
  });

  return this.save();
};

teamSchema.methods.updateResources = async function(
  type: TeamResource['type'],
  used: number
): Promise<TeamDocument> {
  const resource = this.resources.find(r => r.type === type);
  if (!resource) {
    throw new Error('Resource not found');
  }

  if (used > resource.allocated) {
    throw new Error('Resource usage exceeds allocation');
  }

  resource.used = used;
  resource.lastUpdated = new Date();

  await this.logActivity({
    type: 'RESOURCE_UPDATED',
    user: new Types.ObjectId(), // System update
    details: { resourceType: type, used }
  });

  return this.save();
};

teamSchema.methods.logActivity = async function(
  activity: Omit<TeamActivity, 'timestamp'>
): Promise<TeamDocument> {
  this.activityLog.push({
    ...activity,
    timestamp: new Date()
  });
  return this.save();
};

export const TeamModel = (mongoose.models.Team as TeamModel) || 
  mongoose.model<ITeam, TeamModel>('Team', teamSchema); 