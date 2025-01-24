import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { generateMockMember } from '@test/utils/test-utils';
import { MemberMetrics } from '@/models/member.model';

describe('Metrics API Routes', () => {
  describe('POST /api/members/[memberId]/metrics', () => {
    it('should update member metrics', async () => {
      const mockMember = generateMockMember();
      const newMetrics: MemberMetrics = {
        type: 'PRODUCTIVITY',
        value: 90,
        period: 'WEEKLY',
        timestamp: new Date(),
      };

      const request = new NextRequest(
        `http://localhost:3000/api/members/${mockMember._id}/metrics`,
        {
          method: 'POST',
          body: JSON.stringify(newMetrics),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request, { params: { memberId: mockMember._id } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.metrics).toContainEqual(expect.objectContaining(newMetrics));
    });

    it('should return 400 for invalid metrics data', async () => {
      const mockMember = generateMockMember();
      const invalidMetrics = {
        type: 'INVALID_TYPE',
        value: -1, // Invalid value
        period: 'INVALID_PERIOD',
        timestamp: new Date(),
      };

      const request = new NextRequest(
        `http://localhost:3000/api/members/${mockMember._id}/metrics`,
        {
          method: 'POST',
          body: JSON.stringify(invalidMetrics),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request, { params: { memberId: mockMember._id } });
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent member', async () => {
      const newMetrics: MemberMetrics = {
        type: 'PRODUCTIVITY',
        value: 90,
        period: 'WEEKLY',
        timestamp: new Date(),
      };

      const request = new NextRequest(
        'http://localhost:3000/api/members/non-existent-id/metrics',
        {
          method: 'POST',
          body: JSON.stringify(newMetrics),
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
      const newMetrics: MemberMetrics = {
        type: 'PRODUCTIVITY',
        value: 90,
        period: 'WEEKLY',
        timestamp: new Date(),
      };

      const request = new NextRequest(
        `http://localhost:3000/api/members/${mockMember._id}/metrics`,
        {
          method: 'POST',
          body: JSON.stringify(newMetrics),
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

  describe('GET /api/members/[memberId]/metrics', () => {
    it('should get member metrics', async () => {
      const mockMember = generateMockMember();
      const request = new NextRequest(
        `http://localhost:3000/api/members/${mockMember._id}/metrics`,
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
        value: expect.any(Number),
        period: expect.any(String),
        timestamp: expect.any(String),
      }));
    });

    it('should filter metrics by period', async () => {
      const mockMember = generateMockMember();
      const period = 'WEEKLY';

      const url = new URL(`http://localhost:3000/api/members/${mockMember._id}/metrics`);
      url.searchParams.set('period', period);

      const request = new NextRequest(url, { method: 'GET' });
      const response = await GET(request, { params: { memberId: mockMember._id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      data.forEach((metric: MemberMetrics) => {
        expect(metric.period).toBe(period);
      });
    });

    it('should return 404 for non-existent member', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/members/non-existent-id/metrics',
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
        `http://localhost:3000/api/members/${mockMember._id}/metrics`,
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