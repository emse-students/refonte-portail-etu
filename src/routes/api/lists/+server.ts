import { json, type RequestEvent } from "@sveltejs/kit";
import db, { getBasicList } from "$lib/server/database";
import type { RawList } from "$lib/databasetypes";
import Permission from "$lib/permissions";
import { checkPermission } from "$lib/server/auth-middleware";

export const GET = async () => {
	const rawLists: RawList[] = await db`
        SELECT
            *
        FROM
            list
    `;

	// Transformer les RawList en List avec l'URL de l'icône
	const lists = await Promise.all(rawLists.map((raw) => getBasicList(raw)));

	// Enrichir avec les noms d'associations
	const associations = await db<{ id: number; name: string }>`SELECT id, name FROM association`;
	const associationMap = new Map(associations.map((a) => [a.id, a.name]));

	const listsWithAssociation = lists.map((list) => ({
		...list,
		association_name: associationMap.get(list.association_id) || "Association inconnue",
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

	const { handle, name, description, association_id, promo, color } = body;

	await db`
        INSERT INTO list (handle, name, description, association_id, promo, color)
        VALUES (${handle}, ${name}, ${description}, ${association_id || null}, ${promo || null}, ${color || 0})
    `;

	return new Response(JSON.stringify({ success: true }), {
		status: 201,
		headers: { "Content-Type": "application/json" },
	});
};

export const PUT = async (event: RequestEvent) => {
	// Vérifier l'authentification et les permissions avec cache
	const authCheck = await checkPermission(event, Permission.ADMIN);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	const body = await event.request.json();

	const { id, handle, name, description, association_id, promo, color } = body;

	await db`
        UPDATE list
        SET 
            handle = ${handle},
            name = ${name},
            description = ${description},
            association_id = ${association_id || null},
            promo = ${promo || null},
            color = ${color || 0},
            edited_at = NOW()
        WHERE id = ${id}
    `;

	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};

export const DELETE = async (event: RequestEvent) => {
	// Vérifier l'authentification et les permissions avec cache
	const authCheck = await checkPermission(event, Permission.ADMIN);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	const body = await event.request.json();
	const { id } = body;

	await db`
        DELETE FROM list
        WHERE id = ${id}
    `;

	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
