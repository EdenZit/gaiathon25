import { http, HttpResponse } from 'msw';
import { generateMockTeam, generateMockMember, generateMockProject } from '../utils/test-utils';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const handlers = [
  // Team endpoints
  http.post(`${baseUrl}/teams`, () => {
    return HttpResponse.json(generateMockTeam());
  }),

  http.get(`${baseUrl}/teams`, () => {
    return HttpResponse.json([generateMockTeam(), generateMockTeam({ _id: 'team-2', name: 'Another Team' })]);
  }),

  http.get(`${baseUrl}/teams/:teamId`, ({ params }) => {
    const { teamId } = params;
    return HttpResponse.json(generateMockTeam({ _id: teamId as string }));
  }),

  http.put(`${baseUrl}/teams/:teamId`, async ({ params, request }) => {
    const { teamId } = params;
    const updates = await request.json() as Record<string, unknown>;
    return HttpResponse.json(generateMockTeam({ _id: teamId as string, ...updates }));
  }),

  // Member endpoints
  http.post(`${baseUrl}/members/invite`, () => {
    return HttpResponse.json({ message: 'Invitation sent successfully' });
  }),

  http.get(`${baseUrl}/members/:memberId`, ({ params }) => {
    const { memberId } = params;
    return HttpResponse.json(generateMockMember({ _id: memberId as string }));
  }),

  http.put(`${baseUrl}/members/:memberId/permissions`, async ({ params, request }) => {
    const { memberId } = params;
    const permissions = await request.json() as Record<string, unknown>;
    return HttpResponse.json(generateMockMember({ _id: memberId as string, ...permissions }));
  }),

  // Activity endpoints
  http.post(`${baseUrl}/members/:memberId/activities`, async ({ params, request }) => {
    const { memberId } = params;
    const activity = await request.json() as Record<string, unknown>;
    return HttpResponse.json(generateMockMember({
      _id: memberId as string,
      activities: [...generateMockMember().activities, activity],
    }));
  }),

  http.get(`${baseUrl}/members/:memberId/activities`, ({ params }) => {
    const { memberId } = params;
    return HttpResponse.json(generateMockMember({ _id: memberId as string }).activities);
  }),

  // Metrics endpoints
  http.post(`${baseUrl}/members/:memberId/metrics`, async ({ params, request }) => {
    const { memberId } = params;
    const metric = await request.json() as Record<string, unknown>;
    return HttpResponse.json(generateMockMember({
      _id: memberId as string,
      metrics: [...generateMockMember().metrics, metric],
    }));
  }),

  http.get(`${baseUrl}/members/:memberId/metrics`, ({ params }) => {
    const { memberId } = params;
    return HttpResponse.json(generateMockMember({ _id: memberId as string }).metrics);
  }),

  // Project endpoints
  http.post(`${baseUrl}/projects`, async ({ request }) => {
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json(generateMockProject(data));
  }),

  http.get(`${baseUrl}/projects`, () => {
    return HttpResponse.json([generateMockProject(), generateMockProject({ _id: 'project-2', title: 'Another Project' })]);
  }),

  http.get(`${baseUrl}/projects/:projectId`, ({ params }) => {
    const { projectId } = params;
    return HttpResponse.json(generateMockProject({ _id: projectId as string }));
  }),

  http.put(`${baseUrl}/projects/:projectId`, async ({ params, request }) => {
    const { projectId } = params;
    const updates = await request.json() as Record<string, unknown>;
    return HttpResponse.json(generateMockProject({ _id: projectId as string, ...updates }));
  }),

  // Error handlers
  http.all('*', ({ request }) => {
    console.error(`Please add request handler for ${request.url}`);
    return HttpResponse.json({ message: 'Please add request handler' }, { status: 500 });
  }),
]; 