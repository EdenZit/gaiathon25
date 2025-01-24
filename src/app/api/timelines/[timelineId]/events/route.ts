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
    const event = await TimelineService.createEvent(
      params.timelineId,
      data,
      token.sub as string
    );

    return NextResponse.json(event);
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
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { timelineId: string } }
): Promise<NextResponse> {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const filters: Record<string, unknown> = {};

    // Parse filter parameters
    if (searchParams.has('startDate')) {
      filters.startDate = searchParams.get('startDate');
    }
    if (searchParams.has('endDate')) {
      filters.endDate = searchParams.get('endDate');
    }
    if (searchParams.has('types')) {
      filters.types = searchParams.get('types')?.split(',');
    }
    if (searchParams.has('status')) {
      filters.status = searchParams.get('status')?.split(',');
    }
    if (searchParams.has('priority')) {
      filters.priority = searchParams.get('priority')?.split(',');
    }
    if (searchParams.has('assignees')) {
      filters.assignees = searchParams.get('assignees')?.split(',');
    }
    if (searchParams.has('tags')) {
      filters.tags = searchParams.get('tags')?.split(',');
    }

    const events = await TimelineService.searchEvents(params.timelineId, filters);
    return NextResponse.json(events);
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
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 