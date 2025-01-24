import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { TeamService } from '@/lib/team/team.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const activities = await TeamService.getTeamActivity(
      params.teamId,
      token.id,
      limit
    );

    return NextResponse.json(activities);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 