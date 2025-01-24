import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { TeamService, createTeamSchema } from '@/lib/team/team.service';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = createTeamSchema.parse(body);

    const team = await TeamService.createTeam(token.id, validatedData);
    return NextResponse.json(team);
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
    const query = searchParams.get('q') || '';
    const visibility = searchParams.get('visibility') as 'PUBLIC' | 'PRIVATE' | undefined;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await TeamService.searchTeams(query, {
      visibility,
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