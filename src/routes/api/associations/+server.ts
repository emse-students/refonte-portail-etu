import type { RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { AssociationDB } from "$lib/databasetypes";

export const GET = async (event: RequestEvent) => {

    const associations: AssociationDB[] = await db`
        SELECT
            *
        FROM
            associations
    `;

    return new Response(JSON.stringify(associations), {
        headers: { "Content-Type": "application/json" }
    });
    
    
};