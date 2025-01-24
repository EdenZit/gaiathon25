import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { MemberService, recordActivitySchema } from '@/lib/member/member.service';

export async function POST(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = recordActivitySchema.parse(body);

    const member = await MemberService.recordActivity(
      params.memberId,
      validatedData
    );

    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') as 'DAILY' | 'WEEKLY' | 'MONTHLY' | null;

    const analytics = await MemberService.getMemberAnalytics(
      params.memberId,
      period || 'WEEKLY'
    );

    return NextResponse.json(analytics.activities);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 