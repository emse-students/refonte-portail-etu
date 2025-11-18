import { json, type RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { RawList } from "$lib/databasetypes";
import { getAssociationWithMembers, getBasicAssociation } from "$lib/server/database";

export const GET = async (event: RequestEvent) => {
	const id = event.params.id;
	const lists =
		await db`SELECT id, name, description FROM list WHERE id = ${id}`;
	
	if (lists.length === 0) {
		return new Response(
			JSON.stringify({ error: "Association not found" }),
			{
				status: 404,
				headers: { "Content-Type": "application/json" },
			}
		);
	}

	const listData: RawList = lists[0];



    // If url contains ?includeMembers=true, include members
    const url = new URL(event.request.url);
    const includeMembers = url.searchParams.get("includeMembers") === "true";
    
    if (includeMembers) {
        const asso = await getAssociationWithMembers(listData);
        return json(asso);
    } else {
        const asso = await getBasicAssociation(listData);
        return json(asso);
    }

};


export const DELETE = async (event: RequestEvent) => {
    const id = event.params.id;
    await db`DELETE FROM association WHERE id = ${id}`;

    return new Response(null, { status: 204 });
}

export const PUT = async (event: RequestEvent) => {
    const id = event.params.id;
    const body = await event.request.json();
    const name = body.name;
    const description = body.description;

    await db`UPDATE association SET name = ${name}, description = ${description} WHERE id = ${id}`;

    return new Response(null, { status: 204 });
}