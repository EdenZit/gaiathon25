import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { TeamService } from '@/lib/team/team.service';
import { z } from 'zod';

const addMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['LEADER', 'MEMBER']).default('MEMBER')
});

const updateMemberSchema = z.object({
  role: z.enum(['LEADER', 'MEMBER'])
});

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { userId, role } = addMemberSchema.parse(body);

    const team = await TeamService.addMember(
      params.teamId,
      token.id,
      userId,
      role
    );

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

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    const body = await req.json();
    const { role } = updateMemberSchema.parse(body);

    const team = await TeamService.updateMemberRole(
      params.teamId,
      token.id,
      userId,
      role
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

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    const team = await TeamService.removeMember(
      params.teamId,
      token.id,
      userId
    );

    return NextResponse.json(team);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 