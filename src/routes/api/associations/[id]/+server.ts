import { json, type RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { RawAssociation } from "$lib/databasetypes";
import { getAssociationWithMembers, getBasicAssociation } from "$lib/server/database";
import { checkAssociationPermission } from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";

export const GET = async (event: RequestEvent) => {
	const id = event.params.id;
	const associations =
		await db<RawAssociation>`SELECT id, name, description, handle FROM association WHERE id = ${id}`;

	if (associations.length === 0) {
		return new Response(JSON.stringify({ error: "Association not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	const associationData = associations[0];

	// If url contains ?includeMembers=true, include members
	const url = new URL(event.request.url);
	const includeMembers = url.searchParams.get("includeMembers") === "true";

	if (includeMembers) {
		const asso = await getAssociationWithMembers(associationData);
		return json(asso);
	} else {
		const asso = await getBasicAssociation(associationData);
		return json(asso);
	}
};

export const DELETE = async (event: RequestEvent) => {
	const id = Number(event.params.id);

	const authCheck = await checkAssociationPermission(event, id, Permission.ADMIN);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	await db`DELETE FROM association WHERE id = ${id}`;

	return new Response(null, { status: 204 });
};

export const PUT = async (event: RequestEvent) => {
	const id = Number(event.params.id);

	const authCheck = await checkAssociationPermission(event, id, Permission.ADMIN);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	const body = await event.request.json();
	const name = body.name;
	const description = body.description;

	await db`UPDATE association SET name = ${name}, description = ${description} WHERE id = ${id}`;

	return new Response(null, { status: 204 });
};
