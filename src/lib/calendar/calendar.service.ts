import { IEvent } from '@/models/event.model';

export async function addToCalendar(event: IEvent): Promise<void> {
  // Implementation for calendar integration would go here
  // This would typically involve integrating with Google Calendar, Outlook, etc.
  console.log('Adding event to calendar:', event.title);
} 