import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { TeamService, updateTeamSchema } from '@/lib/team/team.service';

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

    return NextResponse.json(team);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

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
    const validatedData = updateTeamSchema.parse(body);

    const team = await TeamService.updateTeam(
      params.teamId,
      token.id,
      validatedData
    );

    return NextResponse.json(team);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
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

    // Check if user is team leader
    const isLeader = team.members.some(
      m => m.user.toString() === token.id && 
          m.status === 'ACTIVE' && 
          m.role === 'LEADER'
    );

    if (!isLeader) {
      return new NextResponse('Only team leaders can delete teams', { status: 403 });
    }

    await team.delete();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 