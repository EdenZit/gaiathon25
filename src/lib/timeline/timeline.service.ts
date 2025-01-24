import { Types } from 'mongoose';
import { Timeline, timelineValidationSchema, ITimeline, TimelineViewEnum } from '@/models/timeline.model';
import { Event, eventValidationSchema, IEvent, EventTypeEnum } from '@/models/event.model';
import { addToCalendar } from '@/lib/calendar/calendar.service';
import { NotFoundError, ValidationError, UnauthorizedError } from '@/lib/errors';

type TimelineViewType = 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';
type EventType = 'TASK' | 'MILESTONE' | 'MEETING' | 'DEADLINE' | 'REVIEW';

export class TimelineService {
  // Timeline Management
  static async createTimeline(data: Record<string, unknown>, userId: string): Promise<ITimeline> {
    const validatedData = timelineValidationSchema.parse(data);
    
    const timeline = new Timeline({
      ...validatedData,
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
    });

    await timeline.save();
    return timeline;
  }

  static async getTimeline(timelineId: string): Promise<ITimeline> {
    const timeline = await Timeline.findById(timelineId)
      .populate('events')
      .populate('team')
      .populate('project')
      .exec();

    if (!timeline) {
      throw new NotFoundError('Timeline not found');
    }

    return timeline;
  }

  static async updateTimeline(timelineId: string, data: Record<string, unknown>, userId: string): Promise<ITimeline> {
    const validatedData = timelineValidationSchema.partial().parse(data);
    
    const timeline = await Timeline.findByIdAndUpdate(
      timelineId,
      {
        ...validatedData,
        updatedBy: new Types.ObjectId(userId),
      },
      { new: true }
    );

    if (!timeline) {
      throw new NotFoundError('Timeline not found');
    }

    return timeline;
  }

  static async deleteTimeline(timelineId: string): Promise<void> {
    const timeline = await Timeline.findByIdAndDelete(timelineId);
    if (!timeline) {
      throw new NotFoundError('Timeline not found');
    }
  }

  // Event Management
  static async createEvent(timelineId: string, data: Record<string, unknown>, userId: string): Promise<IEvent> {
    const timeline = await this.getTimeline(timelineId);
    const validatedData = eventValidationSchema.parse(data);
    
    const event = new Event({
      ...validatedData,
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
    });

    await event.save();

    // Add event to timeline
    timeline.events.push(event._id);
    await timeline.save();

    // Add to calendar if it's a calendar event
    const eventType = validatedData.type as EventType;
    if (eventType === 'MEETING' || eventType === 'DEADLINE') {
      await addToCalendar(event);
    }

    return event;
  }

  static async updateEvent(eventId: string, data: Record<string, unknown>, userId: string): Promise<IEvent> {
    const validatedData = eventValidationSchema.partial().parse(data);
    
    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        ...validatedData,
        updatedBy: new Types.ObjectId(userId),
      },
      { new: true }
    );

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  }

  static async deleteEvent(timelineId: string, eventId: string): Promise<void> {
    const timeline = await this.getTimeline(timelineId);
    
    // Remove event from timeline
    timeline.events = timeline.events.filter(e => !e.equals(eventId));
    await timeline.save();

    // Delete the event
    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
  }

  // Timeline Filtering and Search
  static async searchEvents(timelineId: string, filters: Record<string, unknown>): Promise<IEvent[]> {
    const timeline = await this.getTimeline(timelineId);
    
    const query: Record<string, unknown> = { _id: { $in: timeline.events } };

    if (filters.startDate) {
      query.startDate = { $gte: new Date(filters.startDate as string) };
    }
    if (filters.endDate) {
      query.endDate = { $lte: new Date(filters.endDate as string) };
    }
    if (filters.types) {
      query.type = { $in: filters.types };
    }
    if (filters.status) {
      query.status = { $in: filters.status };
    }
    if (filters.priority) {
      query.priority = { $in: filters.priority };
    }
    if (filters.assignees) {
      query.assignees = { $in: filters.assignees };
    }
    if (filters.tags) {
      query.tags = { $in: filters.tags };
    }

    return Event.find(query).sort({ startDate: 1 }).exec();
  }

  // Timeline Export
  static async exportTimeline(timelineId: string, format: 'pdf' | 'csv' | 'ical', userId: string): Promise<string> {
    const timeline = await this.getTimeline(timelineId);
    
    // Implementation for export functionality would go here
    // This would typically involve generating the appropriate file format
    // and storing it in a cloud storage service
    
    const exportUrl = `https://storage.example.com/exports/${timelineId}-${format}`;
    
    // Record export in history
    timeline.exportHistory.push({
      format,
      url: exportUrl,
      createdAt: new Date(),
      createdBy: new Types.ObjectId(userId),
    });
    
    await timeline.save();
    
    return exportUrl;
  }

  // Custom Views Management
  static async createCustomView(
    timelineId: string,
    data: {
      name: string;
      filters: {
        types?: string[];
        tags?: string[];
        assignees?: string[];
        priority?: string[];
        status?: string[];
      };
      view: keyof typeof TimelineViewEnum;
      isDefault: boolean;
    },
  ): Promise<ITimeline> {
    const timeline = await this.getTimeline(timelineId);
    
    if (data.isDefault) {
      // If this view is set as default, remove default from other views
      timeline.customViews.forEach(view => {
        view.isDefault = false;
      });
    }

    // Convert assignee strings to ObjectIds
    const customView = {
      ...data,
      filters: {
        ...data.filters,
        assignees: data.filters.assignees?.map(id => new Types.ObjectId(id)),
      },
    };

    timeline.customViews.push(customView);
    await timeline.save();

    return timeline;
  }

  static async updateCustomView(
    timelineId: string,
    viewName: string,
    data: {
      name?: string;
      filters?: {
        types?: string[];
        tags?: string[];
        assignees?: string[];
        priority?: string[];
        status?: string[];
      };
      view?: TimelineViewType;
      isDefault?: boolean;
    },
  ): Promise<ITimeline> {
    const timeline = await this.getTimeline(timelineId);
    
    const viewIndex = timeline.customViews.findIndex(v => v.name === viewName);
    if (viewIndex === -1) {
      throw new NotFoundError('Custom view not found');
    }

    if (data.isDefault) {
      // If this view is set as default, remove default from other views
      timeline.customViews.forEach(view => {
        view.isDefault = false;
      });
    }

    // Convert assignee strings to ObjectIds if present
    const updatedView = {
      ...data,
      filters: data.filters ? {
        ...data.filters,
        assignees: data.filters.assignees?.map(id => new Types.ObjectId(id)),
      } : undefined,
    };

    timeline.customViews[viewIndex] = {
      ...timeline.customViews[viewIndex],
      ...updatedView,
    };

    await timeline.save();
    return timeline;
  }

  static async deleteCustomView(timelineId: string, viewName: string): Promise<ITimeline> {
    const timeline = await this.getTimeline(timelineId);
    
    timeline.customViews = timeline.customViews.filter(v => v.name !== viewName);
    await timeline.save();

    return timeline;
  }

  // Timeline Search
  static async searchTimelines(query: Record<string, unknown>): Promise<ITimeline[]> {
    return Timeline.find(query)
      .populate('events')
      .populate('team')
      .populate('project')
      .sort({ createdAt: -1 })
      .exec();
  }
} 