import { json, type RequestEvent } from "@sveltejs/kit";
import db, { getBasicList } from "$lib/server/database";
import type { RawList } from "$lib/databasetypes";
import Permission from "$lib/permissions";
import { checkPermission } from "$lib/server/auth-middleware";

export const GET = async (event: RequestEvent) => {
    const rawLists: RawList[] = await db`
        SELECT
            *
        FROM
            list
    `;

    // Transformer les RawList en List avec l'URL de l'icône
    const lists = await Promise.all(
        rawLists.map(raw => getBasicList(raw))
    );

    // Enrichir avec les noms d'associations
    const associations = await db`SELECT id, name FROM association`;
    const associationMap = new Map(associations.map((a: any) => [a.id, a.name]));
    
    const listsWithAssociation = lists.map(list => ({
        ...list,
        association_name: associationMap.get(list.association_id) || 'Association inconnue'
    }));

    return json(listsWithAssociation);
};

export const POST = async (event: RequestEvent) => {
    // Vérifier l'authentification et les permissions avec cache
    const authCheck = await checkPermission(event, Permission.ADMIN);
    if (!authCheck.authorized) {
        return authCheck.response;
    }

    const body = await event.request.json();

    const { name, description } = body;

    await db`
        INSERT INTO list (name, description)
        VALUES (${name}, ${description})
    `;

    return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
    });
};