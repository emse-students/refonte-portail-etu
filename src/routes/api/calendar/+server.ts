import type { RequestEvent } from "@sveltejs/kit";

const mockCalendarData = [
    {
        id: '1',
        title: 'Event 1',
        start: new Date('2024-10-01T10:00:00Z'),
        end: new Date('2024-10-01T12:00:00Z'),
        association: 'Association A',
        location: 'Location A',
        description: 'Description for Event 1'
    },
    {
        id: '2',
        title: 'Event 2',
        start: new Date('2024-10-05T14:00:00Z'),
        end: new Date('2024-10-05T16:00:00Z'),
        association: 'Association B',
        location: 'Location B',
        description: 'Description for Event 2'
    },
];

// GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD

export const GET = async (event: RequestEvent) => {

    // Look for date parameters in the query string
    const url = new URL(event.request.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    return new Response(JSON.stringify({
        calendar: mockCalendarData.filter(event => {
            const eventDate = event.start.toISOString().split('T')[0];
            return (!start || eventDate >= start) && (!end || eventDate <= end);
        })
    }), {
        headers: {
            "Content-Type": "application/json",
        },
    });
}