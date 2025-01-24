import { MemberService } from '@/services/member.service';
import { generateMockMember } from '@test/utils/test-utils';
import { MemberActivity, MemberMetrics } from '@/models/member.model';

describe('MemberService', () => {
  const mockMemberId = 'member-1';

  describe('inviteMember', () => {
    it('should send an invitation to a new member', async () => {
      const inviteData = {
        email: 'newmember@example.com',
        teamId: 'team-1',
        role: 'MEMBER',
      };
      const response = await MemberService.inviteMember(inviteData);
      expect(response.message).toBe('Invitation sent successfully');
    });

    it('should throw an error if email is invalid', async () => {
      const invalidData = {
        email: 'invalid-email',
        teamId: 'team-1',
        role: 'MEMBER',
      };
      await expect(MemberService.inviteMember(invalidData)).rejects.toThrow();
    });
  });

  describe('getMember', () => {
    it('should get a member by ID', async () => {
      const mockMember = generateMockMember();
      const response = await MemberService.getMember(mockMember._id);
      expect(response).toEqual(mockMember);
    });

    it('should throw an error if member is not found', async () => {
      await expect(MemberService.getMember('non-existent-id')).rejects.toThrow();
    });
  });

  describe('updatePermissions', () => {
    it('should update member permissions', async () => {
      const mockMember = generateMockMember();
      const newPermissions = {
        canManageProjects: true,
        canInviteMembers: false,
      };
      const response = await MemberService.updatePermissions(mockMember._id, newPermissions);
      expect(response.permissions).toEqual(expect.objectContaining(newPermissions));
    });
  });

  describe('recordActivity', () => {
    it('should record a new activity', async () => {
      const mockMember = generateMockMember();
      const newActivity: MemberActivity = {
        type: 'PROJECT_CONTRIBUTION',
        timestamp: new Date(),
        details: {
          action: 'Code review',
          impact: 5,
        },
      };
      const response = await MemberService.recordActivity(mockMember._id, newActivity);
      expect(response.activities).toContainEqual(expect.objectContaining(newActivity));
    });
  });

  describe('updateMetrics', () => {
    it('should update member metrics', async () => {
      const mockMember = generateMockMember();
      const newMetrics: MemberMetrics = {
        type: 'PRODUCTIVITY',
        value: 90,
        period: 'WEEKLY',
        timestamp: new Date(),
      };
      const response = await MemberService.updateMetrics(mockMember._id, newMetrics);
      expect(response.metrics).toContainEqual(expect.objectContaining(newMetrics));
    });
  });

  describe('getMemberAnalytics', () => {
    it('should get member analytics for a specific period', async () => {
      const mockMember = generateMockMember();
      const period = 'WEEKLY';
      const response = await MemberService.getMemberAnalytics(mockMember._id, period);
      expect(response).toHaveProperty('activities');
      expect(response).toHaveProperty('metrics');
      expect(response).toHaveProperty('scores');
    });

    it('should throw an error if period is invalid', async () => {
      const mockMember = generateMockMember();
      const invalidPeriod = 'INVALID';
      await expect(MemberService.getMemberAnalytics(mockMember._id, invalidPeriod)).rejects.toThrow();
    });
  });

  describe('getTeamAnalytics', () => {
    it('should get team analytics for all members', async () => {
      const teamId = 'team-1';
      const period = 'WEEKLY';
      const response = await MemberService.getTeamAnalytics(teamId, period);
      expect(response).toHaveProperty('members');
      expect(response).toHaveProperty('averageScores');
      expect(response.members).toBeInstanceOf(Array);
    });

    it('should calculate correct average scores', async () => {
      const teamId = 'team-1';
      const period = 'WEEKLY';
      const response = await MemberService.getTeamAnalytics(teamId, period);
      expect(response.averageScores).toHaveProperty('productivity');
      expect(response.averageScores).toHaveProperty('collaboration');
      expect(response.averageScores).toHaveProperty('quality');
      expect(response.averageScores.productivity).toBeGreaterThanOrEqual(0);
      expect(response.averageScores.productivity).toBeLessThanOrEqual(10);
    });
  });
}); 