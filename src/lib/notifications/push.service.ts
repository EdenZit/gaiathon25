import webpush from 'web-push';
import { INotification } from '@/models/notification.model';
import { Types } from 'mongoose';
import { RedisService } from '@/lib/cache/redis.service';

// Configure web push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushService {
  static async sendPushNotification(
    subscription: PushSubscription,
    notification: INotification & { _id: Types.ObjectId }
  ): Promise<void> {
    try {
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.content,
        icon: '/icons/notification.png',
        badge: '/icons/badge.png',
        data: {
          url: notification.actionUrl,
          notificationId: notification._id.toString(),
        },
        actions: [
          {
            action: 'view',
            title: 'View',
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
          },
        ],
      });

      await webpush.sendNotification(
        subscription as webpush.PushSubscription,
        payload
      );
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  static async sendPushNotificationToUser(
    userId: string,
    notification: INotification & { _id: Types.ObjectId }
  ): Promise<void> {
    try {
      // Get user's push subscriptions from Redis
      const subscriptions = await this.getUserSubscriptions(userId);
      
      // Send push notification to each subscription
      await Promise.all(
        subscriptions.map(subscription =>
          this.sendPushNotification(subscription, notification).catch(error => {
            if ((error as { statusCode?: number }).statusCode === 410) {
              // Subscription has expired or is invalid
              this.deletePushSubscription(userId, subscription.endpoint).catch(console.error);
            }
            console.error('Error sending push notification:', error);
          })
        )
      );
    } catch (error) {
      console.error('Error sending push notification to user:', error);
      throw error;
    }
  }

  static async broadcastPushNotification(
    userIds: string[],
    notification: INotification & { _id: Types.ObjectId }
  ): Promise<void> {
    try {
      await Promise.all(
        userIds.map(userId => this.sendPushNotificationToUser(userId, notification))
      );
    } catch (error) {
      console.error('Error broadcasting push notification:', error);
      throw error;
    }
  }

  static async savePushSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    try {
      // Store subscription in Redis with user ID as key
      const key = `push:subscriptions:${userId}`;
      const subscriptions = await this.getUserSubscriptions(userId);
      
      // Check if subscription already exists
      if (!subscriptions.some(sub => sub.endpoint === subscription.endpoint)) {
        subscriptions.push(subscription);
        await RedisService.cacheUserPreferences(key, {
          data: subscriptions,
          type: 'push_subscriptions',
        });
      }
    } catch (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }
  }

  static async deletePushSubscription(userId: string, endpoint: string): Promise<void> {
    try {
      // Remove subscription from Redis
      const key = `push:subscriptions:${userId}`;
      const subscriptions = await this.getUserSubscriptions(userId);
      
      const updatedSubscriptions = subscriptions.filter(
        subscription => subscription.endpoint !== endpoint
      );
      
      await RedisService.cacheUserPreferences(key, {
        data: updatedSubscriptions,
        type: 'push_subscriptions',
      });
    } catch (error) {
      console.error('Error deleting push subscription:', error);
      throw error;
    }
  }

  static async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    try {
      const key = `push:subscriptions:${userId}`;
      const data = await RedisService.getUserPreferences(key);
      if (data && typeof data === 'object' && 'type' in data && data.type === 'push_subscriptions') {
        return (data as { data: PushSubscription[] }).data;
      }
      return [];
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      return [];
    }
  }

  static getPublicKey(): string {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('VAPID public key not configured');
    }
    return publicKey;
  }

  static generateVAPIDKeys(): { publicKey: string; privateKey: string } {
    return webpush.generateVAPIDKeys();
  }
} 