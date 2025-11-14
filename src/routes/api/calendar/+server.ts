import type { RequestEvent } from "@sveltejs/kit";

// GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD

import { escape, getPool } from "$lib/server/database";
import { json, text } from "@sveltejs/kit";
import type { RawEvent } from "$lib/databasetypes";

export async function GET(event: RequestEvent) {
    const startParam = event.url.searchParams.get("start");
    const endParam = event.url.searchParams.get("end");
    const assocIdParam = event.url.searchParams.get("asso");

    // Validation et préparation des paramètres
    const start = startParam ? new Date(startParam) : null;
    const end = endParam ? new Date(endParam) : null;
    const assocId = assocIdParam ? Number(assocIdParam) : null;

    const hasStart = start && !isNaN(start.getTime());
    const hasEnd = end && !isNaN(end.getTime());
    const hasAssoc = assocId && assocId > 0;

    // Construction dynamique des conditions SQL avec escape
    const conditions: string[] = ["1=1"];

    if (hasStart) {
        conditions.push(`e.start_date >= ${escape(start!.toISOString())}`);
    }
    if (hasEnd) {
        conditions.push(`e.end_date <= ${escape(end!.toISOString())}`);
    }
    if (hasAssoc) {
        conditions.push(`e.association_id = ${escape(assocId!)}`);
    }

    const whereClause = conditions.join(" AND ");
    

    const rows = (await getPool()!.query(`
        SELECT 
            e.id, e.title, e.start_date, e.end_date, e.description, e.location, e.association_id,
            a.name as association_name, a.color as association_color
        FROM event e
        LEFT JOIN association a ON e.association_id = a.id
        WHERE ${whereClause}
        ORDER BY e.start_date ASC
    `))[0] as RawEvent[];

    return text(rows[0].toString());
}



