import type { RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { RawAssociation } from "$lib/databasetypes";

export const GET = async (event: RequestEvent) => {

    const associations: RawAssociation[] = await db`
        SELECT
            *
        FROM
            association
    `;

    return new Response(JSON.stringify(associations), {
        headers: { "Content-Type": "application/json" }
    });
    
    
};

export const POST = async (event: RequestEvent) => {
    const body = await event.request.json();

    const session = await event.locals.auth();
    if (!session || !session.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    const userId = session?.user?.id;

    //fFetch global permissions for the user
    const userPermissionsResult = await db`
        SELECT
            r.permissions
        FROM
            member m
            JOIN role r ON m.role_id = r.id
        WHERE
            m.user_id = ${userId}
    `;

    const name = body.name;
    const description = body.description;

    const result = await db`
        INSERT INTO association (name, description)
        VALUES (${name}, ${description})
        RETURNING id, name, description
    `;

    const newAssociation: RawAssociation = result[0];



    return new Response(JSON.stringify(newAssociation), {
        status: 201,
        headers: { "Content-Type": "application/json" }
    });
};