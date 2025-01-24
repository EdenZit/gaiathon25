import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { generateMockTeam } from '@test/utils/test-utils';

describe('Team API Routes', () => {
  describe('POST /api/teams', () => {
    it('should create a new team', async () => {
      const teamData = {
        name: 'Test Team',
        description: 'A test team',
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        body: JSON.stringify(teamData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(expect.objectContaining(teamData));
    });

    it('should return 400 for invalid team data', async () => {
      const invalidData = {
        name: 'a', // Too short
        description: 'A test team',
      };

      const request = new NextRequest('http://localhost:3000/api/teams', {
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
      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/teams', () => {
    it('should get all teams', async () => {
      const request = new NextRequest('http://localhost:3000/api/teams');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toEqual(expect.objectContaining({
        _id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        members: expect.any(Array),
      }));
    });

    it('should filter teams by search query', async () => {
      const searchQuery = 'Test';
      const url = new URL('http://localhost:3000/api/teams');
      url.searchParams.set('search', searchQuery);

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      data.forEach((team: any) => {
        expect(team.name.toLowerCase()).toContain(searchQuery.toLowerCase());
      });
    });

    it('should return 401 for unauthorized request', async () => {
      const request = new NextRequest('http://localhost:3000/api/teams', {
        headers: {
          'Authorization': 'invalid-token',
        },
      });

      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });
}); 