import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { TimelineService } from '@/lib/timeline/timeline.service';
import { NotFoundError, ValidationError, UnauthorizedError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: { timelineId: string } }
): Promise<NextResponse> {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { format } = data;

    if (!format || !['pdf', 'csv', 'ical'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid export format. Must be one of: pdf, csv, ical' },
        { status: 400 }
      );
    }

    const exportUrl = await TimelineService.exportTimeline(
      params.timelineId,
      format,
      token.sub as string
    );

    return NextResponse.json({ url: exportUrl });
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
    console.error('Error exporting timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 