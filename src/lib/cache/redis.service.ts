import Redis from 'ioredis';
import { INotification } from '@/models/notification.model';
import { Types } from 'mongoose';

// Redis configuration from .cursorrules
const redisConfig = {
  maxMemory: '2gb',
  evictionPolicy: 'allkeys-lru',
  persistence: true,
};

// Create Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    if (times > 3) return null;
    return Math.min(times * 100, 3000);
  },
  // Redis configuration
  ...redisConfig,
});

// Key patterns
const NOTIFICATION_KEY = 'notification:';
const NOTIFICATION_QUEUE_KEY = 'notification:queue:';
const NOTIFICATION_COUNT_KEY = 'notification:count:';
const USER_NOTIFICATIONS_KEY = 'user:notifications:';
const USER_PREFERENCES_KEY = 'user:preferences:';

export class RedisService {
  // Notification caching
  static async cacheNotification(notification: INotification & { _id: Types.ObjectId }): Promise<void> {
    const notificationKey = `${NOTIFICATION_KEY}${notification._id}`;
    const userNotificationsKey = `${USER_NOTIFICATIONS_KEY}${notification.recipient}`;

    // Cache the notification with 24h expiry
    await redis.setex(
      notificationKey,
      86400,
      JSON.stringify(notification)
    );

    // Add to user's notification list
    await redis.zadd(
      userNotificationsKey,
      notification.createdAt.getTime(),
      notification._id.toString()
    );

    // Update unread count
    if (!notification.isRead) {
      await redis.incr(`${NOTIFICATION_COUNT_KEY}${notification.recipient}`);
    }
  }

  static async getNotification(notificationId: string): Promise<INotification | null> {
    const notification = await redis.get(`${NOTIFICATION_KEY}${notificationId}`);
    return notification ? JSON.parse(notification) : null;
  }

  static async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<string[]> {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    return redis.zrevrange(
      `${USER_NOTIFICATIONS_KEY}${userId}`,
      start,
      end
    );
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const count = await redis.get(`${NOTIFICATION_COUNT_KEY}${userId}`);
    return count ? parseInt(count) : 0;
  }

  static async markAsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<void> {
    const multi = redis.multi();

    for (const id of notificationIds) {
      const notification = await this.getNotification(id);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date();
        
        multi.set(
          `${NOTIFICATION_KEY}${id}`,
          JSON.stringify(notification),
          'KEEPTTL'
        );
      }
    }

    // Update unread count
    multi.decrby(
      `${NOTIFICATION_COUNT_KEY}${userId}`,
      notificationIds.length
    );

    await multi.exec();
  }

  // Notification queue management
  static async queueNotification(
    channel: string,
    notification: Record<string, unknown>
  ): Promise<void> {
    await redis.rpush(
      `${NOTIFICATION_QUEUE_KEY}${channel}`,
      JSON.stringify(notification)
    );
  }

  static async dequeueNotification(channel: string): Promise<Record<string, unknown> | null> {
    const notification = await redis.lpop(`${NOTIFICATION_QUEUE_KEY}${channel}`);
    return notification ? JSON.parse(notification) : null;
  }

  // User preferences caching
  static async cacheUserPreferences(
    userId: string,
    preferences: Record<string, unknown>
  ): Promise<void> {
    await redis.set(
      `${USER_PREFERENCES_KEY}${userId}`,
      JSON.stringify(preferences)
    );
  }

  static async getUserPreferences(userId: string): Promise<Record<string, unknown> | null> {
    const preferences = await redis.get(`${USER_PREFERENCES_KEY}${userId}`);
    return preferences ? JSON.parse(preferences) : null;
  }

  // Real-time notification channels
  static async subscribeToChannel(channel: string, callback: (message: string) => void): Promise<void> {
    const subscriber = redis.duplicate();
    await subscriber.subscribe(channel);
    subscriber.on('message', (_, message) => callback(message));
  }

  static async publishToChannel(channel: string, message: string): Promise<number> {
    return redis.publish(channel, message);
  }

  // Cleanup methods
  static async clearUserNotifications(userId: string): Promise<void> {
    const multi = redis.multi();
    
    // Get all notification IDs for the user
    const notificationIds = await this.getUserNotifications(userId, 1, 1000);
    
    // Delete each notification
    for (const id of notificationIds) {
      multi.del(`${NOTIFICATION_KEY}${id}`);
    }

    // Delete user's notification list and count
    multi.del(`${USER_NOTIFICATIONS_KEY}${userId}`);
    multi.del(`${NOTIFICATION_COUNT_KEY}${userId}`);

    await multi.exec();
  }

  static async clearExpiredNotifications(): Promise<void> {
    // This is handled automatically by Redis TTL
    // We only need to clean up user notification lists
    // Implementation would depend on specific requirements
  }
} 