import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { generateMockMember } from '@test/utils/test-utils';
import { MemberActivity } from '@/models/member.model';

describe('Activity API Routes', () => {
  describe('POST /api/members/[memberId]/activities', () => {
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

      const request = new NextRequest(
        `http://localhost:3000/api/members/${mockMember._id}/activities`,
        {
          method: 'POST',
          body: JSON.stringify(newActivity),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request, { params: { memberId: mockMember._id } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.activities).toContainEqual(expect.objectContaining(newActivity));
    });

    it('should return 400 for invalid activity data', async () => {
      const mockMember = generateMockMember();
      const invalidActivity = {
        type: 'INVALID_TYPE',
        timestamp: new Date(),
        details: {
          action: 'Invalid action',
        },
      };

      const request = new NextRequest(
        `http://localhost:3000/api/members/${mockMember._id}/activities`,
        {
          method: 'POST',
          body: JSON.stringify(invalidActivity),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request, { params: { memberId: mockMember._id } });
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent member', async () => {
      const newActivity: MemberActivity = {
        type: 'PROJECT_CONTRIBUTION',
        timestamp: new Date(),
        details: {
          action: 'Code review',
          impact: 5,
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/members/non-existent-id/activities',
        {
          method: 'POST',
          body: JSON.stringify(newActivity),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request, { params: { memberId: 'non-existent-id' } });
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthorized request', async () => {
      const mockMember = generateMockMember();
      const newActivity: MemberActivity = {
        type: 'PROJECT_CONTRIBUTION',
        timestamp: new Date(),
        details: {
          action: 'Code review',
          impact: 5,
        },
      };

      const request = new NextRequest(
        `http://localhost:3000/api/members/${mockMember._id}/activities`,
        {
          method: 'POST',
          body: JSON.stringify(newActivity),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'invalid-token',
          },
        }
      );

      const response = await POST(request, { params: { memberId: mockMember._id } });
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/members/[memberId]/activities', () => {
    it('should get member activities', async () => {
      const mockMember = generateMockMember();
      const request = new NextRequest(
        `http://localhost:3000/api/members/${mockMember._id}/activities`,
        {
          method: 'GET',
        }
      );
      const response = await GET(request, { params: { memberId: mockMember._id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toEqual(expect.objectContaining({
        type: expect.any(String),
        timestamp: expect.any(String),
        details: expect.any(Object),
      }));
    });

    it('should filter activities by date range', async () => {
      const mockMember = generateMockMember();
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const url = new URL(`http://localhost:3000/api/members/${mockMember._id}/activities`);
      url.searchParams.set('startDate', startDate);
      url.searchParams.set('endDate', endDate);

      const request = new NextRequest(url, { method: 'GET' });
      const response = await GET(request, { params: { memberId: mockMember._id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      data.forEach((activity: MemberActivity) => {
        const activityDate = new Date(activity.timestamp);
        expect(activityDate >= new Date(startDate)).toBe(true);
        expect(activityDate <= new Date(endDate)).toBe(true);
      });
    });

    it('should return 404 for non-existent member', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/members/non-existent-id/activities',
        {
          method: 'GET',
        }
      );
      const response = await GET(request, { params: { memberId: 'non-existent-id' } });
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthorized request', async () => {
      const mockMember = generateMockMember();
      const request = new NextRequest(
        `http://localhost:3000/api/members/${mockMember._id}/activities`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'invalid-token',
          },
        }
      );

      const response = await GET(request, { params: { memberId: mockMember._id } });
      expect(response.status).toBe(401);
    });
  });
}); 