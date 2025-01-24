import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { TeamService } from '@/lib/team/team.service';
import { z } from 'zod';

const updateResourceSchema = z.object({
  type: z.enum(['STORAGE', 'COMPUTE', 'API_CALLS']),
  used: z.number().min(0)
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { type, used } = updateResourceSchema.parse(body);

    const team = await TeamService.updateTeamResources(
      params.teamId,
      token.id,
      type,
      used
    );

    return NextResponse.json(team);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const team = await TeamService.getTeam(params.teamId);
    if (!team) {
      return new NextResponse('Team not found', { status: 404 });
    }

    return NextResponse.json(team.resources);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 