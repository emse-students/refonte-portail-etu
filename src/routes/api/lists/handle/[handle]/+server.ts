import type { RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { RawList, RawAssociation } from "$lib/databasetypes";
import { getListWithMembers } from "$lib/server/database";
import { json } from "@sveltejs/kit";

export const GET = async (event: RequestEvent) => {
	const handle = event.params.handle;
	const lists = await db<RawList>`SELECT * FROM list WHERE handle = ${handle}`;

	if (lists.length === 0) {
		return new Response(JSON.stringify({ error: "List not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	const listData = lists[0];

	const listWithMembers = await getListWithMembers(listData);

	// Fetch associated association if it exists
	if (listData.association_id) {
		const associations =
			await db<RawAssociation>`SELECT * FROM association WHERE id = ${listData.association_id}`;
		if (associations.length > 0) {
			const assocData = associations[0];
			listWithMembers.association = assocData;
		}
	}

	return json(listWithMembers, {
		headers: {
			"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
		},
	});
};
