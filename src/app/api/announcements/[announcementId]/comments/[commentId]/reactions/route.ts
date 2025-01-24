import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AnnouncementService } from '@/lib/announcements/announcement.service';
import { NotFoundError, ValidationError, UnauthorizedError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: { announcementId: string; commentId: string } }
): Promise<NextResponse> {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const announcement = await AnnouncementService.toggleReaction(
      params.announcementId,
      params.commentId,
      data.reaction,
      token.sub as string
    );

    return NextResponse.json(announcement);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error toggling reaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 