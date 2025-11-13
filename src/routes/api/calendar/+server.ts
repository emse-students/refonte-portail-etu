import type { RequestEvent } from "@sveltejs/kit";

// GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD

import db from "$lib/server/database";
import { json } from "@sveltejs/kit";

export async function GET(event: RequestEvent) {
    const start = new Date(event.url.searchParams.get("start") || "");
    const end = new Date(event.url.searchParams.get("end") || "");

    const events = await db`
        SELECT
            e.id,
            e.title,
            e.start_date,
            e.end_date,
            e.description,
            e.location,
            e.association_id,
            a.color
        FROM event e
        LEFT JOIN association a ON e.association_id = a.id
        WHERE e.start_date >= ${start} AND e.end_date <= ${end}
    `;

	return json(events);
}
