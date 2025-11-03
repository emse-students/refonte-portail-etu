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

export const POST = async (event: RequestEvent) => {
    const body = await event.request.json();
    const name = body.name;
    const description = body.description;

    const result = await db`
        INSERT INTO associations (name, description)
        VALUES (${name}, ${description})
        RETURNING id, name, description
    `;

    const newAssociation: AssociationDB = result[0];

    return new Response(JSON.stringify(newAssociation), {
        status: 201,
        headers: { "Content-Type": "application/json" }
    });
};