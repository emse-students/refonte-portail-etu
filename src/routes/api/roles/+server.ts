import { json, type RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { RawRole } from "$lib/databasetypes";
import Permission from "$lib/permissions";
import { checkPermission } from "$lib/server/auth-middleware";

export const GET = async (event: RequestEvent) => {
    // Liste des rôles accessible à tous les utilisateurs authentifiés
    const roles = await db<RawRole>`
        SELECT
            id, name, hierarchy, permissions
        FROM
            role
        ORDER BY hierarchy DESC
    `;

    return json(roles);
};

export const POST = async (event: RequestEvent) => {
    // Création de rôle nécessite ROLES permission
    const authCheck = await checkPermission(event, Permission.ROLES);
    if (!authCheck.authorized) {
        return authCheck.response;
    }

    const body = await event.request.json();
    const { name, hierarchy, permissions } = body;

    await db`
        INSERT INTO role (name, hierarchy, permissions)
        VALUES (${name}, ${hierarchy || 0}, ${permissions || 0})
    `;

    return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
    });
};

export const PUT = async (event: RequestEvent) => {
    // Modification de rôle nécessite ROLES permission
    const authCheck = await checkPermission(event, Permission.ROLES);
    if (!authCheck.authorized) {
        return authCheck.response;
    }

    const body = await event.request.json();
    const { id, name, hierarchy, permissions } = body;

    await db`
        UPDATE role 
        SET name = ${name}, hierarchy = ${hierarchy}, permissions = ${permissions}
        WHERE id = ${id}
    `;

    return json({ success: true });
};

export const DELETE = async (event: RequestEvent) => {
    // Suppression de rôle nécessite ROLES permission
    const authCheck = await checkPermission(event, Permission.ROLES);
    if (!authCheck.authorized) {
        return authCheck.response;
    }

    const body = await event.request.json();
    const { id } = body;

    await db`DELETE FROM role WHERE id = ${id}`;

    return json({ success: true });
};
