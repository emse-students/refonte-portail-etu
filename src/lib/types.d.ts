// Types for the calendar events
export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    association: string;
    location?: string;
    description?: string;
}



