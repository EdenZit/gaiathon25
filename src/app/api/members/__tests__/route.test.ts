import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { generateMockMember } from '@test/utils/test-utils';

describe('Member API Routes', () => {
  describe('POST /api/members/invite', () => {
    it('should send an invitation to a new member', async () => {
      const inviteData = {
        email: 'newmember@example.com',
        teamId: 'team-1',
        role: 'MEMBER',
      };

      const request = new NextRequest('http://localhost:3000/api/members/invite', {
        method: 'POST',
        body: JSON.stringify(inviteData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Invitation sent successfully');
    });

    it('should return 400 for invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        teamId: 'team-1',
        role: 'MEMBER',
      };

      const request = new NextRequest('http://localhost:3000/api/members/invite', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthorized request', async () => {
      const request = new NextRequest('http://localhost:3000/api/members/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/members/:memberId/analytics', () => {
    it('should get member analytics', async () => {
      const mockMember = generateMockMember();
      const url = new URL(`http://localhost:3000/api/members/${mockMember._id}/analytics`);
      url.searchParams.set('period', 'WEEKLY');

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(expect.objectContaining({
        activities: expect.any(Array),
        metrics: expect.any(Array),
        scores: expect.objectContaining({
          productivity: expect.any(Number),
          collaboration: expect.any(Number),
          quality: expect.any(Number),
        }),
      }));
    });

    it('should return 400 for invalid period', async () => {
      const mockMember = generateMockMember();
      const url = new URL(`http://localhost:3000/api/members/${mockMember._id}/analytics`);
      url.searchParams.set('period', 'INVALID');

      const request = new NextRequest(url);
      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent member', async () => {
      const url = new URL('http://localhost:3000/api/members/non-existent-id/analytics');
      url.searchParams.set('period', 'WEEKLY');

      const request = new NextRequest(url);
      const response = await GET(request);
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthorized request', async () => {
      const mockMember = generateMockMember();
      const url = new URL(`http://localhost:3000/api/members/${mockMember._id}/analytics`);
      url.searchParams.set('period', 'WEEKLY');

      const request = new NextRequest(url, {
        headers: {
          'Authorization': 'invalid-token',
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });
}); 