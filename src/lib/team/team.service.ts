import { z } from 'zod';
import { TeamModel, TeamDocument, TeamMember } from '@/models/team.model';
import { Types } from 'mongoose';

// Validation schemas
export const createTeamSchema = z.object({
  name: z.string()
    .min(3, 'Team name must be at least 3 characters')
    .max(20, 'Team name must be at most 20 characters')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Team name can only contain letters, numbers, hyphens, and underscores'),
  description: z.string().max(500).optional(),
  settings: z.object({
    isOpen: z.boolean().default(false),
    requiresApproval: z.boolean().default(true),
    maxMembers: z.number().min(2).max(4).default(4),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC')
  }).optional()
});

export const updateTeamSchema = createTeamSchema.partial();

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

export class TeamService {
  static async createTeam(
    leaderId: string,
    data: CreateTeamInput
  ): Promise<TeamDocument> {
    const team = await new TeamModel({
      ...data,
      members: [{
        user: new Types.ObjectId(leaderId),
        role: 'LEADER',
        joinedAt: new Date(),
        status: 'ACTIVE'
      }],
      resources: [
        {
          type: 'STORAGE',
          allocated: 5 * 1024 * 1024 * 1024, // 5GB
          used: 0,
          lastUpdated: new Date()
        },
        {
          type: 'COMPUTE',
          allocated: 100,
          used: 0,
          lastUpdated: new Date()
        },
        {
          type: 'API_CALLS',
          allocated: 10000,
          used: 0,
          lastUpdated: new Date()
        }
      ]
    }).save() as Promise<TeamDocument>;

    return team;
  }

  static async getTeam(teamId: string): Promise<TeamDocument | null> {
    return TeamModel.findById(teamId).populate('members.user', 'name email').exec() as Promise<TeamDocument | null>;
  }

  static async getTeamByName(name: string): Promise<TeamDocument | null> {
    return TeamModel.findOne({ name }).populate('members.user', 'name email').exec() as Promise<TeamDocument | null>;
  }

  static async updateTeam(
    teamId: string,
    userId: string,
    data: UpdateTeamInput
  ): Promise<TeamDocument> {
    const team = await TeamModel.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const member = team.members.find(m => 
      m.user.toString() === userId && 
      m.status === 'ACTIVE' && 
      m.role === 'LEADER'
    );

    if (!member) {
      throw new Error('Only team leaders can update team settings');
    }

    Object.assign(team, data);
    await team.save();

    await team.logActivity({
      type: 'SETTINGS_UPDATED',
      user: new Types.ObjectId(userId),
      details: data
    });

    return team;
  }

  static async addMember(
    teamId: string,
    leaderId: string,
    userId: string,
    role: 'LEADER' | 'MEMBER' = 'MEMBER'
  ): Promise<TeamDocument> {
    const team = await TeamModel.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const leader = team.members.find(m => 
      m.user.toString() === leaderId && 
      m.status === 'ACTIVE' && 
      m.role === 'LEADER'
    );

    if (!leader) {
      throw new Error('Only team leaders can add members');
    }

    return team.addMember(userId, role);
  }

  static async removeMember(
    teamId: string,
    leaderId: string,
    userId: string
  ): Promise<TeamDocument> {
    const team = await TeamModel.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const leader = team.members.find(m => 
      m.user.toString() === leaderId && 
      m.status === 'ACTIVE' && 
      m.role === 'LEADER'
    );

    if (!leader) {
      throw new Error('Only team leaders can remove members');
    }

    return team.removeMember(userId);
  }

  static async updateMemberRole(
    teamId: string,
    leaderId: string,
    userId: string,
    newRole: 'LEADER' | 'MEMBER'
  ): Promise<TeamDocument> {
    const team = await TeamModel.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const leader = team.members.find(m => 
      m.user.toString() === leaderId && 
      m.status === 'ACTIVE' && 
      m.role === 'LEADER'
    );

    if (!leader) {
      throw new Error('Only team leaders can update member roles');
    }

    return team.updateMemberRole(userId, newRole);
  }

  static async getUserTeams(userId: string): Promise<TeamDocument[]> {
    return TeamModel.find({
      'members': {
        $elemMatch: {
          user: new Types.ObjectId(userId),
          status: 'ACTIVE'
        }
      }
    }).populate('members.user', 'name email');
  }

  static async searchTeams(
    query: string,
    options: {
      visibility?: 'PUBLIC' | 'PRIVATE';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ teams: TeamDocument[]; total: number }> {
    const { visibility = 'PUBLIC', limit = 10, offset = 0 } = options;

    const filter = {
      'settings.visibility': visibility,
      $or: [
        { name: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') }
      ]
    };

    const [teams, total] = await Promise.all([
      TeamModel.find(filter)
        .populate('members.user', 'name email')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit),
      TeamModel.countDocuments(filter)
    ]);

    return { teams, total };
  }

  static async updateTeamResources(
    teamId: string,
    leaderId: string,
    type: 'STORAGE' | 'COMPUTE' | 'API_CALLS',
    used: number
  ): Promise<TeamDocument> {
    const team = await TeamModel.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const leader = team.members.find(m => 
      m.user.toString() === leaderId && 
      m.status === 'ACTIVE' && 
      m.role === 'LEADER'
    );

    if (!leader) {
      throw new Error('Only team leaders can update resource usage');
    }

    return team.updateResources(type, used);
  }

  static async getTeamActivity(
    teamId: string,
    userId: string,
    limit: number = 10
  ): Promise<TeamDocument['activityLog']> {
    const team = await TeamModel.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const member = team.members.find(m => 
      m.user.toString() === userId && 
      m.status === 'ACTIVE'
    );

    if (!member) {
      throw new Error('Only team members can view activity');
    }

    return team.activityLog
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
} 