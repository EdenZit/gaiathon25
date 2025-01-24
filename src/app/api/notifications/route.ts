import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NotificationService } from '@/lib/notifications/notification.service';
import { NotFoundError, ValidationError, UnauthorizedError } from '@/lib/errors';

// Enums for notification types and priorities
export enum NotificationTypeEnum {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  EVENT = 'EVENT',
  TASK = 'TASK',
  MENTION = 'MENTION',
  COMMENT = 'COMMENT',
  TEAM = 'TEAM',
  PROJECT = 'PROJECT',
  MILESTONE = 'MILESTONE',
  SYSTEM = 'SYSTEM'
}

export enum NotificationPriorityEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

interface GetNotificationsOptions {
  page: number;
  limit: number;
  type?: NotificationTypeEnum;
  priority?: NotificationPriorityEnum;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') as NotificationTypeEnum | null;
    const priority = searchParams.get('priority') as NotificationPriorityEnum | null;
    const isRead = searchParams.get('isRead') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const notifications = await NotificationService.getUserNotifications(token.sub as string, page, limit, {
      type: type || undefined,
      priority: priority || undefined,
      isRead: isRead || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });

    return NextResponse.json(notifications);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { notificationIds } = data;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    // Mark notifications as read
    await NotificationService.markAsRead(
      notificationIds.map(id => id.toString()),
      token.sub as string
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { notificationIds } = data;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    await Promise.all(
      notificationIds.map(id => 
        NotificationService.deleteNotification(id.toString(), token.sub as string)
      )
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 