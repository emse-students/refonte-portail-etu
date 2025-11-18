import { json, type RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { RawUser } from "$lib/databasetypes";
import Permission from "$lib/permissions";
import { checkPermission } from "$lib/server/auth-middleware";

export const GET = async (event: RequestEvent) => {
    const users = await db<RawUser>`
        SELECT
            id, first_name, last_name, email, login, permissions, created_at, edited_at
        FROM
            user
        ORDER BY id DESC
    `;

    return json(users);
};

export const POST = async (event: RequestEvent) => {
    // Création d'utilisateur nécessite SITE_ADMIN
    const authCheck = await checkPermission(event, Permission.SITE_ADMIN);
    if (!authCheck.authorized) {
        return authCheck.response;
    }

    const body = await event.request.json();
    const { first_name, last_name, email, login, permissions } = body;

    await db`
        INSERT INTO user (first_name, last_name, email, login, permissions)
        VALUES (${first_name}, ${last_name}, ${email}, ${login}, ${permissions || 0})
    `;

    return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
    });
};

export const PUT = async (event: RequestEvent) => {
    // Modification d'utilisateur nécessite SITE_ADMIN
    const authCheck = await checkPermission(event, Permission.SITE_ADMIN);
    if (!authCheck.authorized) {
        return authCheck.response;
    }

    const body = await event.request.json();
    const { id, first_name, last_name, email, login, permissions } = body;

    await db`
        UPDATE user 
        SET first_name = ${first_name}, last_name = ${last_name}, email = ${email}, 
            login = ${login}, permissions = ${permissions}
        WHERE id = ${id}
    `;

    return json({ success: true });
};

export const DELETE = async (event: RequestEvent) => {
    // Suppression d'utilisateur nécessite SITE_ADMIN
    const authCheck = await checkPermission(event, Permission.SITE_ADMIN);
    if (!authCheck.authorized) {
        return authCheck.response;
    }

    const body = await event.request.json();
    const { id } = body;

    await db`DELETE FROM user WHERE id = ${id}`;

    return json({ success: true });
};
