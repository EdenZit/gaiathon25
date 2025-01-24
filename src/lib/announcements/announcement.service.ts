import { Types } from 'mongoose';
import { Announcement, announcementValidationSchema, commentValidationSchema, IAnnouncement, IComment } from '@/models/announcement.model';
import { NotificationService } from '@/lib/notifications/notification.service';
import { NotFoundError, ValidationError, UnauthorizedError } from '@/lib/errors';

interface ICommentDocument extends IComment {
  _id: Types.ObjectId;
}

interface IAnnouncementDocument extends IAnnouncement {
  _id: Types.ObjectId;
  comments: Types.DocumentArray<ICommentDocument>;
}

export class AnnouncementService {
  // Create announcement
  static async createAnnouncement(data: Record<string, unknown>, userId: string): Promise<IAnnouncement> {
    const validatedData = announcementValidationSchema.parse(data);
    
    const announcement = new Announcement({
      ...validatedData,
      author: new Types.ObjectId(userId),
    });

    await announcement.save();

    // Send notifications to target audience
    await this.notifyTargetAudience(announcement);

    return announcement;
  }

  // Get announcements
  static async getAnnouncements(
    filters: Record<string, unknown>,
    page = 1,
    limit = 20
  ): Promise<{ announcements: IAnnouncement[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }
    if (filters.team) {
      query['$or'] = [
        { team: new Types.ObjectId(filters.team as string) },
        { 'targetAudience.teams': new Types.ObjectId(filters.team as string) },
      ];
    }
    if (filters.isArchived !== undefined) {
      query.isArchived = filters.isArchived;
    }
    if (filters.search) {
      query['$text'] = { $search: filters.search as string };
    }
    if (filters.validFrom) {
      query.validFrom = { $lte: new Date(filters.validFrom as string) };
    }
    if (filters.validUntil) {
      query.validUntil = { $gte: new Date(filters.validUntil as string) };
    }

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name avatar')
        .populate('team', 'name')
        .populate('project', 'name')
        .exec(),
      Announcement.countDocuments(query),
    ]);

    return { announcements, total };
  }

  static async getAnnouncement(announcementId: string): Promise<IAnnouncement> {
    const announcement = await Announcement.findById(announcementId)
      .populate('author', 'name avatar')
      .populate('team', 'name')
      .populate('project', 'name')
      .exec();

    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    return announcement;
  }

  // Update announcement
  static async updateAnnouncement(
    announcementId: string,
    data: Record<string, unknown>,
    userId: string
  ): Promise<IAnnouncement> {
    const announcement = await this.getAnnouncement(announcementId);

    // Check if user is the author
    if (!announcement.author._id.equals(userId)) {
      throw new UnauthorizedError('Only the author can update the announcement');
    }

    const validatedData = announcementValidationSchema.partial().parse(data);
    
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      announcementId,
      validatedData,
      { new: true }
    )
      .populate('author', 'name avatar')
      .populate('team', 'name')
      .populate('project', 'name');

    if (!updatedAnnouncement) {
      throw new NotFoundError('Announcement not found');
    }

    return updatedAnnouncement;
  }

  // Archive/Unarchive
  static async toggleArchiveStatus(
    announcementId: string,
    userId: string
  ): Promise<IAnnouncement> {
    const announcement = await this.getAnnouncement(announcementId);

    // Check if user is the author
    if (!announcement.author._id.equals(userId)) {
      throw new UnauthorizedError('Only the author can archive/unarchive the announcement');
    }

    announcement.isArchived = !announcement.isArchived;
    await announcement.save();

    return announcement;
  }

  // Comments
  static async addComment(
    announcementId: string,
    data: Record<string, unknown>,
    userId: string
  ): Promise<IAnnouncementDocument> {
    const validatedData = commentValidationSchema.parse(data);
    
    const announcement = await this.getAnnouncement(announcementId) as IAnnouncementDocument;
    
    const comment = {
      content: validatedData.content,
      author: new Types.ObjectId(userId),
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    announcement.comments.push(comment);
    await announcement.save();

    // Get the created comment
    const createdComment = announcement.comments[announcement.comments.length - 1];

    // Notify the announcement author and mentioned users
    await this.notifyCommentParticipants(announcement, createdComment);

    return announcement;
  }

  static async updateComment(
    announcementId: string,
    commentId: string,
    data: Record<string, unknown>,
    userId: string
  ): Promise<IAnnouncementDocument> {
    const validatedData = commentValidationSchema.parse(data);
    
    const announcement = await this.getAnnouncement(announcementId) as IAnnouncementDocument;
    const comment = announcement.comments.find(c => c._id.toString() === commentId);

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Check if user is the comment author
    if (!comment.author.equals(userId)) {
      throw new UnauthorizedError('Only the author can update the comment');
    }

    comment.content = validatedData.content;
    comment.updatedAt = new Date();

    await announcement.save();
    return announcement;
  }

  static async deleteComment(
    announcementId: string,
    commentId: string,
    userId: string
  ): Promise<IAnnouncementDocument> {
    const announcement = await this.getAnnouncement(announcementId) as IAnnouncementDocument;
    const comment = announcement.comments.find(c => c._id.toString() === commentId);

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Check if user is the comment author
    if (!comment.author.equals(userId)) {
      throw new UnauthorizedError('Only the author can delete the comment');
    }

    announcement.comments = announcement.comments.filter(c => c._id.toString() !== commentId);
    await announcement.save();

    return announcement;
  }

  // Reactions
  static async toggleReaction(
    announcementId: string,
    commentId: string,
    reactionType: string,
    userId: string
  ): Promise<IAnnouncementDocument> {
    const announcement = await this.getAnnouncement(announcementId) as IAnnouncementDocument;
    const comment = announcement.comments.find(c => c._id.toString() === commentId);

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    const reaction = comment.reactions.find(r => r.type === reactionType);
    if (reaction) {
      // Toggle user's reaction
      const userIndex = reaction.users.findIndex(u => u.equals(userId));
      if (userIndex === -1) {
        reaction.users.push(new Types.ObjectId(userId));
      } else {
        reaction.users.splice(userIndex, 1);
      }
    } else {
      // Add new reaction type
      comment.reactions.push({
        type: reactionType,
        users: [new Types.ObjectId(userId)],
      });
    }

    await announcement.save();
    return announcement;
  }

  // Private helper methods
  private static async notifyTargetAudience(announcement: IAnnouncementDocument): Promise<void> {
    const targetUsers: string[] = [];

    // Collect target users based on teams, roles, and direct members
    if (announcement.targetAudience.teams) {
      // Fetch users from teams
      // Implementation depends on team structure
    }
    if (announcement.targetAudience.roles) {
      // Fetch users with specified roles
      // Implementation depends on role structure
    }
    if (announcement.targetAudience.members) {
      targetUsers.push(...announcement.targetAudience.members.map(m => m.toString()));
    }

    // Create and send notifications
    const notificationPromises = targetUsers.map(userId =>
      NotificationService.createNotification({
        type: 'ANNOUNCEMENT',
        priority: announcement.priority,
        recipient: userId,
        title: `New Announcement: ${announcement.title}`,
        content: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
        channels: ['IN_APP', 'EMAIL'],
        actionUrl: `/announcements/${announcement._id.toString()}`,
        relatedEntities: [{
          type: 'Announcement',
          id: announcement._id.toString(),
        }],
      })
    );

    await Promise.all(notificationPromises);
  }

  private static async notifyCommentParticipants(
    announcement: IAnnouncementDocument,
    comment: ICommentDocument
  ): Promise<void> {
    const notifyUsers = new Set<string>();

    // Notify announcement author
    notifyUsers.add(announcement.author.toString());

    // Extract and notify mentioned users
    const mentionRegex = /@(\w+)/g;
    const mentions = comment.content.match(mentionRegex) || [];
    for (const mention of mentions) {
      // Fetch user by username and add to notifyUsers
      // Implementation depends on user structure
    }

    // Create and send notifications
    const notificationPromises = Array.from(notifyUsers).map(userId =>
      NotificationService.createNotification({
        type: 'COMMENT',
        priority: 'MEDIUM',
        recipient: userId,
        title: `New comment on announcement: ${announcement.title}`,
        content: comment.content.substring(0, 200) + (comment.content.length > 200 ? '...' : ''),
        channels: ['IN_APP'],
        actionUrl: `/announcements/${announcement._id.toString()}#comment-${comment._id.toString()}`,
        relatedEntities: [{
          type: 'Announcement',
          id: announcement._id.toString(),
        }],
      })
    );

    await Promise.all(notificationPromises);
  }
} 