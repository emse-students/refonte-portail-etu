import { json, type RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { RawList } from "$lib/databasetypes";
import { getListWithMembers, getBasicList } from "$lib/server/database";
import { checkListPermission } from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";

export const GET = async (event: RequestEvent) => {
	const id = event.params.id;
	const lists = await db<RawList>`SELECT id, name, description FROM list WHERE id = ${id}`;

	if (lists.length === 0) {
		return new Response(JSON.stringify({ error: "List not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	const listData = lists[0];

	// If url contains ?includeMembers=true, include members
	const url = new URL(event.request.url);
	const includeMembers = url.searchParams.get("includeMembers") === "true";

	if (includeMembers) {
		const asso = await getListWithMembers(listData);
		return json(asso);
	} else {
		const asso = await getBasicList(listData);
		return json(asso);
	}
};

export const DELETE = async (event: RequestEvent) => {
	const id = Number(event.params.id);

	const authCheck = await checkListPermission(event, id, Permission.ADMIN);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	await db`DELETE FROM list WHERE id = ${id}`;

	return new Response(null, { status: 204 });
};

export const PUT = async (event: RequestEvent) => {
	const id = Number(event.params.id);

	const authCheck = await checkListPermission(event, id, Permission.ADMIN);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	const body = await event.request.json();
	const { name, description, handle, color, icon, promo, association_id } = body;

	await db`
        UPDATE list 
        SET 
            name = ${name}, 
            description = ${description},
            handle = ${handle},
            color = ${color || 0},
            icon = ${icon || null},
            promo = ${promo || null},
            association_id = ${association_id || null}
        WHERE id = ${id}
    `;

	return new Response(null, { status: 204 });
};
