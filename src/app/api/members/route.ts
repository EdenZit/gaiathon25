import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { MemberService, createInvitationSchema } from '@/lib/member/member.service';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = createInvitationSchema.parse(body);

    const member = await MemberService.inviteMember(token.id, validatedData);
    return NextResponse.json(member);
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
    const period = searchParams.get('period') as 'DAILY' | 'WEEKLY' | 'MONTHLY' | null;

    if (!teamId) {
      return new NextResponse('Team ID is required', { status: 400 });
    }

    const analytics = await MemberService.getTeamAnalytics(
      teamId,
      period || 'WEEKLY'
    );

    return NextResponse.json(analytics);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 