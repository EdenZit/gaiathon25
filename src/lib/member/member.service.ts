import { z } from 'zod';
import { Member, MemberModel, MemberActivity, MemberMetrics, MemberPermission } from '@/models/member.model';
import { TeamService } from '@/lib/team/team.service';
import { sendVerificationEmail } from '@/lib/email/email.service';
import { Types, Document } from 'mongoose';

// Validation schemas
export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['LEADER', 'MEMBER']),
  teamId: z.string(),
  metadata: z.record(z.any()).optional()
});

export const updatePermissionsSchema = z.array(z.object({
  resource: z.enum(['PROJECT', 'TEAM', 'CODE', 'DEPLOYMENT', 'SETTINGS']),
  actions: z.array(z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'])),
  conditions: z.record(z.any()).optional()
}));

export const recordActivitySchema = z.object({
  type: z.enum(['PROJECT_CONTRIBUTION', 'TASK_COMPLETION', 'CODE_REVIEW', 'DOCUMENTATION', 'MEETING_ATTENDANCE']),
  projectId: z.string().optional(),
  details: z.object({
    action: z.string(),
    impact: z.number().min(1).max(10),
    duration: z.number().optional(),
    metadata: z.record(z.any()).optional()
  })
});

export const updateMetricsSchema = z.object({
  type: z.enum(['PRODUCTIVITY', 'COLLABORATION', 'QUALITY', 'ENGAGEMENT']),
  value: z.number(),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  metadata: z.record(z.any()).optional()
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
export type RecordActivityInput = z.infer<typeof recordActivitySchema>;
export type UpdateMetricsInput = z.infer<typeof updateMetricsSchema>;

export class MemberService {
  static async inviteMember(
    userId: string,
    data: CreateInvitationInput
  ): Promise<Member> {
    const team = await TeamService.getTeam(data.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const isLeader = team.members.some(m => 
      m.user instanceof Types.ObjectId ? 
        m.user.toString() === userId :
        m.user === userId
    );

    if (!isLeader) {
      throw new Error('Only team leaders can send invitations');
    }

    const existingMember = await MemberModel.findOne({
      'invitations.email': data.email.toLowerCase(),
      team: new Types.ObjectId(data.teamId),
      'invitations.status': 'PENDING'
    });

    if (existingMember) {
      throw new Error('An invitation is already pending for this email');
    }

    const member = await MemberModel.findOne({ 
      team: new Types.ObjectId(data.teamId) 
    });
    
    if (!member) {
      throw new Error('Team member record not found');
    }

    const invitation = await member.sendInvitation({
      email: data.email.toLowerCase(),
      role: data.role,
      team: new Types.ObjectId(data.teamId),
      invitedBy: new Types.ObjectId(userId),
      metadata: data.metadata
    });

    // Send invitation email using the verification email function temporarily
    await sendVerificationEmail(data.email, invitation.token);

    return member;
  }

  static async acceptInvitation(token: string): Promise<Member> {
    const member = await MemberModel.findOne({
      'invitations.token': token,
      'invitations.status': 'PENDING',
      'invitations.expiresAt': { $gt: new Date() }
    });

    if (!member) {
      throw new Error('Invalid or expired invitation');
    }

    const invitation = member.invitations.find(i => i.token === token);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    invitation.status = 'ACCEPTED';
    member.role = invitation.role;
    member.status = 'ACTIVE';

    // Set default permissions based on role
    const defaultPermissions: MemberPermission[] = invitation.role === 'LEADER' 
      ? [
          {
            resource: 'TEAM',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE']
          },
          {
            resource: 'PROJECT',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE']
          }
        ]
      : [
          {
            resource: 'PROJECT',
            actions: ['READ', 'UPDATE']
          }
        ];

    member.permissions = defaultPermissions;
    await member.save();

    return member;
  }

  static async updatePermissions(
    memberId: string,
    userId: string,
    permissions: UpdatePermissionsInput
  ): Promise<Member> {
    const member = await MemberModel.findById(memberId).populate('team');
    if (!member) {
      throw new Error('Member not found');
    }

    const team = await TeamService.getTeam(
      member.team instanceof Types.ObjectId ? 
        member.team.toString() : 
        (member.team as any)._id?.toString()
    );
    
    if (!team) {
      throw new Error('Team not found');
    }

    const isLeader = team.members.some(m => 
      m.user instanceof Types.ObjectId ? 
        m.user.toString() === userId :
        m.user === userId
    );

    if (!isLeader) {
      throw new Error('Only team leaders can update permissions');
    }

    const updatedMember = await member.updatePermissions(permissions);
    return updatedMember;
  }

  static async recordActivity(
    memberId: string,
    data: RecordActivityInput
  ): Promise<Member> {
    const member = await MemberModel.findById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    const activity: Omit<MemberActivity, 'timestamp'> = {
      type: data.type,
      project: data.projectId ? new Types.ObjectId(data.projectId) : undefined,
      details: data.details
    };

    const updatedMember = await member.recordActivity(activity);
    return updatedMember;
  }

  static async updateMetrics(
    memberId: string,
    data: UpdateMetricsInput
  ): Promise<Member> {
    const member = await MemberModel.findById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    const updatedMember = await member.updateMetrics(data);
    return updatedMember;
  }

  static async getMemberAnalytics(
    memberId: string,
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'WEEKLY'
  ): Promise<{
    activities: MemberActivity[];
    metrics: MemberMetrics[];
    scores: {
      productivity: number;
      collaboration: number;
      quality: number;
    };
  }> {
    const member = await MemberModel.findById(memberId);
    if (!member || !(member instanceof Document)) {
      throw new Error('Member not found');
    }

    const now = new Date();
    const timeRange = period === 'DAILY' 
      ? 24 * 60 * 60 * 1000  // 1 day
      : period === 'MONTHLY'
        ? 30 * 24 * 60 * 60 * 1000  // 30 days
        : 7 * 24 * 60 * 60 * 1000;  // 7 days (WEEKLY)

    const activities = member.activities.filter(
      a => (now.getTime() - a.timestamp.getTime()) < timeRange
    );

    const metrics = member.metrics.filter(
      m => m.period === period &&
          (now.getTime() - m.timestamp.getTime()) < timeRange
    );

    const scores = member.calculateScores();

    return { 
      activities,
      metrics,
      scores 
    };
  }

  static async getTeamAnalytics(
    teamId: string,
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'WEEKLY'
  ): Promise<{
    members: Array<{
      member: Member;
      analytics: {
        activities: MemberActivity[];
        metrics: MemberMetrics[];
        scores: {
          productivity: number;
          collaboration: number;
          quality: number;
        };
      };
    }>;
    teamAverages: {
      productivity: number;
      collaboration: number;
      quality: number;
    };
  }> {
    const members = await MemberModel.find({
      team: teamId,
      status: 'ACTIVE'
    });

    const memberAnalytics = await Promise.all(
      members.map(async (member) => ({
        member,
        analytics: await this.getMemberAnalytics(member._id.toString(), period)
      }))
    );

    const teamAverages = memberAnalytics.reduce(
      (acc, { analytics: { scores } }) => ({
        productivity: acc.productivity + scores.productivity,
        collaboration: acc.collaboration + scores.collaboration,
        quality: acc.quality + scores.quality
      }),
      { productivity: 0, collaboration: 0, quality: 0 }
    );

    const memberCount = memberAnalytics.length;
    if (memberCount > 0) {
      teamAverages.productivity /= memberCount;
      teamAverages.collaboration /= memberCount;
      teamAverages.quality /= memberCount;
    }

    return {
      members: memberAnalytics,
      teamAverages: {
        productivity: Math.round(teamAverages.productivity * 10) / 10,
        collaboration: Math.round(teamAverages.collaboration * 10) / 10,
        quality: Math.round(teamAverages.quality * 10) / 10
      }
    };
  }
} 