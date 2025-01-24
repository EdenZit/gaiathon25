import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ProjectService, createProjectSchema } from '@/lib/project/project.service';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { teamId, ...projectData } = body;
    
    if (!teamId) {
      return new NextResponse('Team ID is required', { status: 400 });
    }

    const validatedData = createProjectSchema.parse(projectData);
    const project = await ProjectService.createProject(teamId, token.id, validatedData);
    
    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    
    if (!teamId) {
      return new NextResponse('Team ID is required', { status: 400 });
    }

    const status = searchParams.get('status') as any;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await ProjectService.getTeamProjects(teamId, {
      status,
      limit,
      offset
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 