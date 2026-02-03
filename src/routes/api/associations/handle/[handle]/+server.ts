import type { RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { RawAssociation } from "$lib/databasetypes";
import { getAssociationWithMembers } from "$lib/server/database";
import { json } from "@sveltejs/kit";

export const GET = async (event: RequestEvent) => {
	const handle = event.params.handle;
	const associations = await db<RawAssociation>`SELECT * FROM association WHERE handle = ${handle}`;

	if (associations.length === 0) {
		return new Response(JSON.stringify({ error: "Association not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	const associationData = associations[0];

	const asso = await getAssociationWithMembers(associationData);
	return json(asso, {
		headers: {
			"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
		},
	});
};
