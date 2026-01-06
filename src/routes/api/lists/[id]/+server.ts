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

	const updates: { col: string; val: string | number | null }[] = [];
	if (name != null) updates.push({ col: "name", val: name });
	if (description != null) updates.push({ col: "description", val: description });
	if (handle != null) updates.push({ col: "handle", val: handle });
	if (color != null) updates.push({ col: "color", val: color });
	if (icon != null) updates.push({ col: "icon", val: icon });
	if (promo != null) updates.push({ col: "promo", val: promo });
	if (association_id != null) updates.push({ col: "association_id", val: association_id });

	if (updates.length > 0) {
		const strings: string[] = [];
		const values: (string | number | null)[] = [];

		strings.push(`UPDATE list SET ${updates[0].col} = `);
		values.push(updates[0].val);

		for (let i = 1; i < updates.length; i++) {
			strings.push(`, ${updates[i].col} = `);
			values.push(updates[i].val);
		}

		strings.push(` WHERE id = `);
		values.push(id);
		strings.push("");

		await db(strings as unknown as TemplateStringsArray, ...values);
	}

	return new Response(null, { status: 204 });
};
