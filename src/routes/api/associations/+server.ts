import { json, type RequestEvent } from "@sveltejs/kit";
import db, { getBasicAssociation } from "$lib/server/database";
import type { RawAssociation } from "$lib/databasetypes";
import Permission from "$lib/permissions";
import { checkPermission } from "$lib/server/auth-middleware";

export const GET = async () => {
	const rawAssociations: RawAssociation[] = await db`
        SELECT
            *
        FROM
            association
    `;

	// Transformer les RawAssociation en Association avec l'URL de l'icône
	const associations = await Promise.all(rawAssociations.map((raw) => getBasicAssociation(raw)));

	return json(associations);
};

export const POST = async (event: RequestEvent) => {
	// Vérifier l'authentification et les permissions avec cache
	const authCheck = await checkPermission(event, Permission.ADMIN);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	const body = await event.request.json();

	const { name, description, icon, color } = body;
	const handle = name.toLowerCase().replace(/[^a-z]/g, "");

	await db`
        INSERT INTO association (name, description, handle, icon, color)
        VALUES (${name}, ${description}, ${handle}, ${icon || null}, ${color || 0})
    `;

	return new Response(JSON.stringify({ success: true }), {
		status: 201,
		headers: { "Content-Type": "application/json" },
	});
};
