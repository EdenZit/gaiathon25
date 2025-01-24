import { Types } from 'mongoose';
import { Notification, notificationValidationSchema, INotification } from '@/models/notification.model';
import { RedisService } from '@/lib/cache/redis.service';
import { PushService } from '@/lib/notifications/push.service';
import { NotFoundError, ValidationError } from '@/lib/errors';

export class NotificationService {
  // Create and send notification
  static async createNotification(data: Record<string, unknown>): Promise<INotification> {
    const validatedData = notificationValidationSchema.parse(data);
    
    const notification = new Notification({
      ...validatedData,
      deliveryStatus: validatedData.channels.map(channel => ({
        channel,
        status: 'pending',
      })),
    });

    await notification.save();

    // Cache the notification
    const savedNotification = notification.toObject();
    await RedisService.cacheNotification({
      ...savedNotification,
      _id: notification._id,
    });

    // Process delivery based on channels
    await this.processNotificationDelivery({
      ...savedNotification,
      _id: notification._id,
    });

    return notification;
  }

  static async processNotificationDelivery(notification: INotification & { _id: Types.ObjectId }): Promise<void> {
    const deliveryPromises = notification.channels.map(async channel => {
      try {
        switch (channel) {
          case 'PUSH':
            await PushService.sendPushNotificationToUser(
              notification.recipient.toString(),
              notification
            );
            break;
          case 'EMAIL':
            // Implement email delivery
            break;
          case 'SLACK':
            // Implement Slack delivery
            break;
        }

        // Update delivery status
        await Notification.updateOne(
          { _id: notification._id, 'deliveryStatus.channel': channel },
          {
            $set: {
              'deliveryStatus.$.status': 'sent',
              'deliveryStatus.$.sentAt': new Date(),
            },
          }
        );
      } catch (error) {
        // Update delivery status with error
        await Notification.updateOne(
          { _id: notification._id, 'deliveryStatus.channel': channel },
          {
            $set: {
              'deliveryStatus.$.status': 'failed',
              'deliveryStatus.$.error': error instanceof Error ? error.message : 'Unknown error',
            },
          }
        );
      }
    });

    await Promise.all(deliveryPromises);
  }

  // Fetch notifications
  static async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
    filters: Record<string, unknown> = {}
  ): Promise<INotification[]> {
    const query: Record<string, unknown> = { recipient: new Types.ObjectId(userId) };

    if (filters.isRead !== undefined) {
      query.isRead = filters.isRead;
    }
    if (filters.type) {
      query.type = filters.type;
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }

    // Try to get from cache first
    const cachedIds = await RedisService.getUserNotifications(userId, page, limit);
    if (cachedIds.length > 0) {
      const notifications = await Promise.all(
        cachedIds.map(id => RedisService.getNotification(id))
      );
      return notifications.filter((n): n is INotification => n !== null);
    }

    // If not in cache, get from database
    return Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  static async getUnreadCount(userId: string): Promise<number> {
    // Try to get from cache first
    const cachedCount = await RedisService.getUnreadCount(userId);
    if (cachedCount !== null) {
      return cachedCount;
    }

    // If not in cache, get from database
    return Notification.countDocuments({
      recipient: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  // Update notifications
  static async markAsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<void> {
    const objectIds = notificationIds.map(id => new Types.ObjectId(id));

    // Update in database
    await Notification.updateMany(
      {
        _id: { $in: objectIds },
        recipient: new Types.ObjectId(userId),
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    // Update in cache
    await RedisService.markAsRead(userId, notificationIds);
  }

  static async markAllAsRead(userId: string): Promise<void> {
    // Update in database
    await Notification.updateMany(
      {
        recipient: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    // Clear cache for this user
    await RedisService.clearUserNotifications(userId);
  }

  // Delete notifications
  static async deleteNotification(
    userId: string,
    notificationId: string
  ): Promise<void> {
    const notification = await Notification.findOneAndDelete({
      _id: new Types.ObjectId(notificationId),
      recipient: new Types.ObjectId(userId),
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Remove from cache
    await RedisService.clearUserNotifications(userId);
  }

  static async deleteAllNotifications(userId: string): Promise<void> {
    await Notification.deleteMany({
      recipient: new Types.ObjectId(userId),
    });

    // Clear cache
    await RedisService.clearUserNotifications(userId);
  }

  // Group notifications
  static async groupNotifications(
    notifications: INotification[],
    groupingRules: Record<string, unknown>
  ): Promise<Record<string, INotification[]>> {
    const groups: Record<string, INotification[]> = {};

    for (const notification of notifications) {
      let groupKey = 'default';

      if (groupingRules.byType && notification.type) {
        groupKey = notification.type;
      } else if (groupingRules.byPriority && notification.priority) {
        groupKey = notification.priority;
      } else if (notification.groupId) {
        groupKey = notification.groupId;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(notification);
    }

    return groups;
  }
} 