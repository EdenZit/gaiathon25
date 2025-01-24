import { rest, RestRequest, ResponseComposition, RestContext } from 'msw';
import { generateMockTeam, generateMockMember, generateMockProject } from '../utils/test-utils';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const handlers = [
  // Team endpoints
  rest.post(`${baseUrl}/teams`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    return res(
      ctx.status(201),
      ctx.json(generateMockTeam())
    );
  }),

  rest.get(`${baseUrl}/teams`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    return res(
      ctx.status(200),
      ctx.json([generateMockTeam(), generateMockTeam({ _id: 'team-2', name: 'Another Team' })])
    );
  }),

  rest.get(`${baseUrl}/teams/:teamId`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    const { teamId } = req.params;
    return res(
      ctx.status(200),
      ctx.json(generateMockTeam({ _id: teamId as string }))
    );
  }),

  rest.put(`${baseUrl}/teams/:teamId`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    const { teamId } = req.params;
    return res(
      ctx.status(200),
      ctx.json(generateMockTeam({ _id: teamId as string, ...req.body }))
    );
  }),

  // Member endpoints
  rest.post(`${baseUrl}/members/invite`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    return res(
      ctx.status(201),
      ctx.json({ message: 'Invitation sent successfully' })
    );
  }),

  rest.get(`${baseUrl}/members/:memberId`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    const { memberId } = req.params;
    return res(
      ctx.status(200),
      ctx.json(generateMockMember({ _id: memberId as string }))
    );
  }),

  rest.put(`${baseUrl}/members/:memberId/permissions`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    const { memberId } = req.params;
    return res(
      ctx.status(200),
      ctx.json(generateMockMember({ _id: memberId as string, ...req.body }))
    );
  }),

  // Activity endpoints
  rest.post(`${baseUrl}/members/:memberId/activities`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    const { memberId } = req.params;
    return res(
      ctx.status(201),
      ctx.json(generateMockMember({
        _id: memberId as string,
        activities: [...generateMockMember().activities, req.body]
      }))
    );
  }),

  rest.get(`${baseUrl}/members/:memberId/activities`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    const { memberId } = req.params;
    return res(
      ctx.status(200),
      ctx.json(generateMockMember({ _id: memberId as string }).activities)
    );
  }),

  // Metrics endpoints
  rest.post(`${baseUrl}/members/:memberId/metrics`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    const { memberId } = req.params;
    return res(
      ctx.status(201),
      ctx.json(generateMockMember({
        _id: memberId as string,
        metrics: [...generateMockMember().metrics, req.body]
      }))
    );
  }),

  rest.get(`${baseUrl}/members/:memberId/metrics`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    const { memberId } = req.params;
    return res(
      ctx.status(200),
      ctx.json(generateMockMember({ _id: memberId as string }).metrics)
    );
  }),

  // Project endpoints
  rest.post(`${baseUrl}/projects`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    return res(
      ctx.status(201),
      ctx.json(generateMockProject())
    );
  }),

  rest.get(`${baseUrl}/projects`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    return res(
      ctx.status(200),
      ctx.json([generateMockProject(), generateMockProject({ _id: 'project-2', title: 'Another Project' })])
    );
  }),

  rest.get(`${baseUrl}/projects/:projectId`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    const { projectId } = req.params;
    return res(
      ctx.status(200),
      ctx.json(generateMockProject({ _id: projectId as string }))
    );
  }),

  rest.put(`${baseUrl}/projects/:projectId`, (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    const { projectId } = req.params;
    return res(
      ctx.status(200),
      ctx.json(generateMockProject({ _id: projectId as string, ...req.body }))
    );
  }),

  // Error handlers
  rest.all('*', (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
    console.error(`Please add request handler for ${req.url.toString()}`);
    return res(
      ctx.status(500),
      ctx.json({ message: 'Please add request handler' })
    );
  })
]; 