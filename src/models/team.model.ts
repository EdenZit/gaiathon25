import mongoose, { Document, Model, Schema } from 'mongoose';
import { User } from './user.model';

export interface TeamMember {
  user: User['_id'];
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
  user: User['_id'];
  timestamp: Date;
  details: Record<string, any>;
}

export interface Team extends Document {
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
  // Virtual fields
  memberCount: number;
  isAtCapacity: boolean;
  // Methods
  addMember(userId: string, role?: 'LEADER' | 'MEMBER'): Promise<Team>;
  removeMember(userId: string): Promise<Team>;
  updateMemberRole(userId: string, newRole: 'LEADER' | 'MEMBER'): Promise<Team>;
  updateResources(type: TeamResource['type'], used: number): Promise<Team>;
  logActivity(activity: Omit<TeamActivity, 'timestamp'>): Promise<Team>;
}

const teamSchema = new Schema<Team>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      validate: {
        validator: function(v: string) {
          return /^[a-zA-Z0-9-_]+$/.test(v);
        },
        message: 'Team name can only contain letters, numbers, hyphens, and underscores'
      }
    },
    description: {
      type: String,
      maxlength: 500,
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
        required: true,
        min: 0
      },
      used: {
        type: Number,
        required: true,
        default: 0,
        min: 0
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
        default: 4,
        min: 2,
        max: 4
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
        default: 0,
        min: 0
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
        type: Schema.Types.Mixed
      }
    }]
  },
  {
    timestamps: true
  }
);

// Indexes
teamSchema.index({ name: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ createdAt: -1 });

// Virtual fields
teamSchema.virtual('memberCount').get(function(this: Team) {
  return this.members.filter((m: TeamMember) => m.status === 'ACTIVE').length;
});

teamSchema.virtual('isAtCapacity').get(function(this: Team) {
  return this.memberCount >= this.settings.maxMembers;
});

// Methods
teamSchema.methods.addMember = async function(userId: string, role: 'LEADER' | 'MEMBER' = 'MEMBER'): Promise<Team> {
  if (this.isAtCapacity) {
    throw new Error('Team is at maximum capacity');
  }

  if (this.members.some((m: TeamMember) => m.user.toString() === userId && m.status === 'ACTIVE')) {
    throw new Error('User is already an active member of this team');
  }

  this.members.push({
    user: userId,
    role,
    joinedAt: new Date(),
    status: 'ACTIVE'
  });

  await this.logActivity({
    type: 'MEMBER_JOINED',
    user: userId,
    details: { role }
  });

  return this.save();
};

teamSchema.methods.removeMember = async function(userId: string): Promise<Team> {
  const member = this.members.find((m: TeamMember) => m.user.toString() === userId && m.status === 'ACTIVE');
  
  if (!member) {
    throw new Error('User is not an active member of this team');
  }

  if (member.role === 'LEADER' && 
      this.members.filter((m: TeamMember) => m.role === 'LEADER' && m.status === 'ACTIVE').length === 1) {
    throw new Error('Cannot remove the last team leader');
  }

  member.status = 'INACTIVE';

  await this.logActivity({
    type: 'MEMBER_LEFT',
    user: userId,
    details: { previousRole: member.role }
  });

  return this.save();
};

teamSchema.methods.updateMemberRole = async function(userId: string, newRole: 'LEADER' | 'MEMBER'): Promise<Team> {
  const member = this.members.find((m: TeamMember) => m.user.toString() === userId && m.status === 'ACTIVE');
  
  if (!member) {
    throw new Error('User is not an active member of this team');
  }

  if (newRole === 'MEMBER' && member.role === 'LEADER' && 
      this.members.filter((m: TeamMember) => m.role === 'LEADER' && m.status === 'ACTIVE').length === 1) {
    throw new Error('Cannot demote the last team leader');
  }

  const oldRole = member.role;
  member.role = newRole;

  await this.logActivity({
    type: 'ROLE_CHANGED',
    user: userId,
    details: { oldRole, newRole }
  });

  return this.save();
};

teamSchema.methods.updateResources = async function(type: TeamResource['type'], used: number): Promise<Team> {
  const resource = this.resources.find((r: TeamResource) => r.type === type);
  
  if (!resource) {
    throw new Error(`Resource type ${type} not found`);
  }

  if (used > resource.allocated) {
    throw new Error(`Resource usage exceeds allocation for ${type}`);
  }

  resource.used = used;
  resource.lastUpdated = new Date();

  await this.logActivity({
    type: 'RESOURCE_UPDATED',
    user: this.members.find((m: TeamMember) => m.role === 'LEADER')?.user,
    details: { resourceType: type, used }
  });

  return this.save();
};

teamSchema.methods.logActivity = async function(activity: Omit<TeamActivity, 'timestamp'>): Promise<Team> {
  this.activityLog.push({
    ...activity,
    timestamp: new Date()
  });
  return this.save();
};

export const TeamModel: Model<Team> = mongoose.models.Team || mongoose.model<Team>('Team', teamSchema); 