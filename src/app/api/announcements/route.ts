import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AnnouncementService } from '@/lib/announcements/announcement.service';
import { NotFoundError, ValidationError, UnauthorizedError } from '@/lib/errors';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const announcement = await AnnouncementService.createAnnouncement(
      data,
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
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filters: Record<string, unknown> = {};

    // Parse filter parameters
    if (searchParams.has('category')) {
      filters.category = searchParams.get('category');
    }
    if (searchParams.has('priority')) {
      filters.priority = searchParams.get('priority');
    }
    if (searchParams.has('team')) {
      filters.team = searchParams.get('team');
    }
    if (searchParams.has('isArchived')) {
      filters.isArchived = searchParams.get('isArchived') === 'true';
    }
    if (searchParams.has('search')) {
      filters.search = searchParams.get('search');
    }
    if (searchParams.has('validFrom')) {
      filters.validFrom = searchParams.get('validFrom');
    }
    if (searchParams.has('validUntil')) {
      filters.validUntil = searchParams.get('validUntil');
    }

    const { announcements, total } = await AnnouncementService.getAnnouncements(
      filters,
      page,
      limit
    );

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 