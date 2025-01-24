import { PushService } from '@/lib/notifications/push.service';
import { RedisService } from '@/lib/cache/redis.service';
import webpush from 'web-push';
import { Types, Model } from 'mongoose';
import { INotification } from '@/models/notification.model';

// Mock dependencies
jest.mock('web-push');
jest.mock('@/lib/cache/redis.service');

// Create a mock for mongoose Document methods
const createMockDocument = <T extends object>(data: T) => ({
  ...data,
  $assertPopulated: jest.fn(),
  $clearModifiedPaths: jest.fn(),
  $clone: jest.fn(),
  $createModifiedPathsSnapshot: jest.fn(),
  $getAllSubdocs: jest.fn(),
  $getPopulatedDocs: jest.fn(),
  $ignore: jest.fn(),
  $inc: jest.fn(),
  $isDefault: jest.fn(),
  $isDeleted: jest.fn(),
  $isEmpty: jest.fn(),
  $isModified: jest.fn(),
  $isNew: jest.fn(),
  $isSelected: jest.fn(),
  $isValid: jest.fn(),
  $locals: {},
  $markValid: jest.fn(),
  $model: jest.fn(),
  $op: null,
  $parent: jest.fn(),
  $restoreModifiedPathsSnapshot: jest.fn(),
  $session: jest.fn(),
  $set: jest.fn(),
  $toObject: jest.fn(),
  $where: jest.fn(),
  collection: {},
  db: {},
  delete: jest.fn(),
  deleteOne: jest.fn(),
  depopulate: jest.fn(),
  directModifiedPaths: jest.fn(),
  equals: jest.fn(),
  errors: {},
  get: jest.fn(),
  getChanges: jest.fn(),
  increment: jest.fn(),
  init: jest.fn(),
  invalidate: jest.fn(),
  isDirectModified: jest.fn(),
  isDirectSelected: jest.fn(),
  isInit: jest.fn(),
  isModified: jest.fn(),
  isNew: false,
  isSelected: jest.fn(),
  markModified: jest.fn(),
  model: (() => {}) as unknown as Model<any>,
  modifiedPaths: jest.fn(),
  overwrite: jest.fn(),
  populate: jest.fn(),
  populated: jest.fn(),
  remove: jest.fn(),
  replaceOne: jest.fn(),
  save: jest.fn(),
  schema: {},
  set: jest.fn(),
  toJSON: jest.fn(),
  toObject: jest.fn(),
  unmarkModified: jest.fn(),
  update: jest.fn(),
  updateOne: jest.fn(),
  validate: jest.fn(),
  validateSync: jest.fn(),
});

describe('PushService', () => {
  const mockUserId = 'user123';
  const mockSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/123',
    keys: {
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-key',
    },
  };

  // Create a mock notification with required fields for testing
  const mockNotification = createMockDocument({
    _id: new Types.ObjectId(),
    type: 'ANNOUNCEMENT',
    priority: 'HIGH',
    recipient: new Types.ObjectId(),
    title: 'Test Notification',
    content: 'Test Content',
    channels: ['PUSH'],
    isRead: false,
    deliveryStatus: [],
    relatedEntities: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as unknown as INotification & { _id: Types.ObjectId };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPushNotification', () => {
    it('should send a push notification successfully', async () => {
      await PushService.sendPushNotification(mockSubscription, mockNotification);

      expect(webpush.sendNotification).toHaveBeenCalledWith(
        mockSubscription,
        expect.any(String)
      );

      const payload = JSON.parse((webpush.sendNotification as jest.Mock).mock.calls[0][1]);
      expect(payload).toEqual({
        title: mockNotification.title,
        body: mockNotification.content,
        icon: '/icons/notification.png',
        badge: '/icons/badge.png',
        data: {
          url: mockNotification.actionUrl,
          notificationId: mockNotification._id.toString(),
        },
        actions: [
          { action: 'view', title: 'View' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      });
    });

    it('should handle errors when sending push notification', async () => {
      const error = new Error('Push service error');
      (webpush.sendNotification as jest.Mock).mockRejectedValue(error);

      await expect(
        PushService.sendPushNotification(mockSubscription, mockNotification)
      ).rejects.toThrow('Push service error');
    });
  });

  describe('savePushSubscription', () => {
    it('should save a new push subscription', async () => {
      (RedisService.getUserPreferences as jest.Mock).mockResolvedValue({
        type: 'push_subscriptions',
        data: [],
      });

      await PushService.savePushSubscription(mockUserId, mockSubscription);

      expect(RedisService.cacheUserPreferences).toHaveBeenCalledWith(
        `push:subscriptions:${mockUserId}`,
        {
          type: 'push_subscriptions',
          data: [mockSubscription],
        }
      );
    });

    it('should not save duplicate subscription', async () => {
      (RedisService.getUserPreferences as jest.Mock).mockResolvedValue({
        type: 'push_subscriptions',
        data: [mockSubscription],
      });

      await PushService.savePushSubscription(mockUserId, mockSubscription);

      expect(RedisService.cacheUserPreferences).not.toHaveBeenCalled();
    });
  });

  describe('deletePushSubscription', () => {
    it('should delete a push subscription', async () => {
      (RedisService.getUserPreferences as jest.Mock).mockResolvedValue({
        type: 'push_subscriptions',
        data: [mockSubscription],
      });

      await PushService.deletePushSubscription(mockUserId, mockSubscription.endpoint);

      expect(RedisService.cacheUserPreferences).toHaveBeenCalledWith(
        `push:subscriptions:${mockUserId}`,
        {
          type: 'push_subscriptions',
          data: [],
        }
      );
    });
  });

  describe('getUserSubscriptions', () => {
    it('should return user subscriptions', async () => {
      (RedisService.getUserPreferences as jest.Mock).mockResolvedValue({
        type: 'push_subscriptions',
        data: [mockSubscription],
      });

      const result = await PushService.getUserSubscriptions(mockUserId);

      expect(result).toEqual([mockSubscription]);
    });

    it('should return empty array when no subscriptions found', async () => {
      (RedisService.getUserPreferences as jest.Mock).mockResolvedValue(null);

      const result = await PushService.getUserSubscriptions(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getPublicKey', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return VAPID public key', () => {
      process.env.VAPID_PUBLIC_KEY = 'test-public-key';

      const result = PushService.getPublicKey();

      expect(result).toBe('test-public-key');
    });

    it('should throw error when VAPID public key is not configured', () => {
      delete process.env.VAPID_PUBLIC_KEY;

      expect(() => PushService.getPublicKey()).toThrow('VAPID public key not configured');
    });
  });

  describe('generateVAPIDKeys', () => {
    it('should generate VAPID keys', () => {
      const mockKeys = {
        publicKey: 'test-public-key',
        privateKey: 'test-private-key',
      };
      (webpush.generateVAPIDKeys as jest.Mock).mockReturnValue(mockKeys);

      const result = PushService.generateVAPIDKeys();

      expect(result).toEqual(mockKeys);
      expect(webpush.generateVAPIDKeys).toHaveBeenCalled();
    });
  });

  describe('sendPushNotificationToUser', () => {
    it('should send notifications to all user subscriptions', async () => {
      const mockSubscriptions = [
        mockSubscription,
        { ...mockSubscription, endpoint: 'endpoint2' },
      ];
      (RedisService.getUserPreferences as jest.Mock).mockResolvedValue({
        type: 'push_subscriptions',
        data: mockSubscriptions,
      });

      await PushService.sendPushNotificationToUser(mockUserId, mockNotification);

      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    });

    it('should handle expired subscriptions', async () => {
      (RedisService.getUserPreferences as jest.Mock).mockResolvedValue({
        type: 'push_subscriptions',
        data: [mockSubscription],
      });
      const error = new Error('Subscription expired');
      (error as any).statusCode = 410;
      (webpush.sendNotification as jest.Mock).mockRejectedValue(error);

      await PushService.sendPushNotificationToUser(mockUserId, mockNotification);

      // Should attempt to delete the expired subscription
      expect(RedisService.cacheUserPreferences).toHaveBeenCalledWith(
        `push:subscriptions:${mockUserId}`,
        {
          type: 'push_subscriptions',
          data: [],
        }
      );
    });
  });

  describe('broadcastPushNotification', () => {
    it('should send notification to multiple users', async () => {
      const userIds = ['user1', 'user2'];
      (RedisService.getUserPreferences as jest.Mock).mockResolvedValue({
        type: 'push_subscriptions',
        data: [mockSubscription],
      });

      await PushService.broadcastPushNotification(userIds, mockNotification);

      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    });
  });
}); 