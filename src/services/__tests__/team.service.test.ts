import { TeamService } from '@/services/team.service';
import { generateMockTeam } from '@test/utils/test-utils';
import { TeamMember } from '@/models/team.model';

describe('TeamService', () => {
  const mockTeamData = {
    name: 'Test Team',
    description: 'A test team',
  };

  describe('createTeam', () => {
    it('should create a new team', async () => {
      const mockResponse = generateMockTeam(mockTeamData);
      const response = await TeamService.createTeam(mockTeamData);
      expect(response).toEqual(mockResponse);
    });

    it('should throw an error if team name is invalid', async () => {
      const invalidData = { ...mockTeamData, name: 'a' }; // Too short
      await expect(TeamService.createTeam(invalidData)).rejects.toThrow();
    });
  });

  describe('getTeam', () => {
    it('should get a team by ID', async () => {
      const mockTeam = generateMockTeam();
      const response = await TeamService.getTeam(mockTeam._id);
      expect(response).toEqual(mockTeam);
    });

    it('should throw an error if team is not found', async () => {
      await expect(TeamService.getTeam('non-existent-id')).rejects.toThrow();
    });
  });

  describe('updateTeam', () => {
    it('should update a team', async () => {
      const mockTeam = generateMockTeam();
      const updates = { name: 'Updated Team Name' };
      const response = await TeamService.updateTeam(mockTeam._id, updates);
      expect(response.name).toBe(updates.name);
    });
  });

  describe('addMember', () => {
    it('should add a member to the team', async () => {
      const mockTeam = generateMockTeam();
      const newMember = {
        user: 'user-2',
        role: 'MEMBER',
      };
      const response = await TeamService.addMember(mockTeam._id, newMember);
      expect(response.members).toHaveLength(mockTeam.members.length + 1);
      expect(response.members).toContainEqual(expect.objectContaining(newMember));
    });

    it('should throw an error if team is full', async () => {
      const fullTeam = generateMockTeam({
        members: Array(4).fill({
          user: 'user-1',
          role: 'MEMBER',
          status: 'ACTIVE',
          joinedAt: new Date(),
        }),
      });
      const newMember = {
        user: 'user-5',
        role: 'MEMBER',
      };
      await expect(TeamService.addMember(fullTeam._id, newMember)).rejects.toThrow();
    });
  });

  describe('removeMember', () => {
    it('should remove a member from the team', async () => {
      const mockTeam = generateMockTeam();
      const memberToRemove = mockTeam.members[0];
      const response = await TeamService.removeMember(mockTeam._id, memberToRemove.user);
      expect(response.members).not.toContainEqual(expect.objectContaining({ user: memberToRemove.user }));
    });

    it('should throw an error if member is the last leader', async () => {
      const mockTeam = generateMockTeam({
        members: [
          {
            user: 'user-1',
            role: 'LEADER',
            status: 'ACTIVE',
            joinedAt: new Date(),
          },
        ],
      });
      await expect(TeamService.removeMember(mockTeam._id, 'user-1')).rejects.toThrow();
    });
  });

  describe('updateMemberRole', () => {
    it('should update a member\'s role', async () => {
      const mockTeam = generateMockTeam();
      const memberToUpdate = mockTeam.members[0];
      const newRole = 'MEMBER';
      const response = await TeamService.updateMemberRole(mockTeam._id, memberToUpdate.user, newRole);
      const updatedMember = response.members.find((m: TeamMember) => m.user === memberToUpdate.user);
      expect(updatedMember?.role).toBe(newRole);
    });

    it('should throw an error if changing the last leader to member', async () => {
      const mockTeam = generateMockTeam({
        members: [
          {
            user: 'user-1',
            role: 'LEADER',
            status: 'ACTIVE',
            joinedAt: new Date(),
          },
        ],
      });
      await expect(TeamService.updateMemberRole(mockTeam._id, 'user-1', 'MEMBER')).rejects.toThrow();
    });
  });
}); 