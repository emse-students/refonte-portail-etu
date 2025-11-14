import { json, type RequestEvent } from "@sveltejs/kit";
import db, { getBasicAssociation } from "$lib/server/database";
import type { RawAssociation } from "$lib/databasetypes";
import Permission, { hasPermission } from "$lib/permissions";

export const GET = async (event: RequestEvent) => {

    const rawAssociations: RawAssociation[] = await db`
        SELECT
            *
        FROM
            association
    `;

    // Transformer les RawAssociation en Association avec l'URL de l'icône
    const associations = await Promise.all(
        rawAssociations.map(raw => getBasicAssociation(raw))
    );

    return json(associations);
    
    
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
            permissions
        FROM
            users
        WHERE
            id = ${userId}
    `;

    const userPermissions = userPermissionsResult.length > 0 ? userPermissionsResult[0].permissions : 0;

    if (hasPermission(userPermissions, Permission.CREATE_ASSOCIATION) === false) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
        });
    }

    const name = body.name;
    const description = body.description;

    const result = await db`
        INSERT INTO associations (name, description)
        VALUES (${name}, ${description})
        RETURNING id, name, description
    `;

    const newAssociation: RawAssociation = result[0];



    return new Response(JSON.stringify(newAssociation), {
        status: 201,
        headers: { "Content-Type": "application/json" }
    });
};