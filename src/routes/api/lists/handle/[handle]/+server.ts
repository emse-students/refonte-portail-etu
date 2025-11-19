import type { RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { RawList, RawAssociation } from "$lib/databasetypes";
import { getListWithMembers } from "$lib/server/database";
import { json } from "@sveltejs/kit";

export const GET = async (event: RequestEvent) => {
    const handle = event.params.handle;
    const lists =
        await db`SELECT * FROM list WHERE handle = ${handle}`;

    if (lists.length === 0) {
        return new Response(
            JSON.stringify({ error: "List not found" }),
            {
                status: 404,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    const listData: RawList = lists[0];

    const listWithMembers = await getListWithMembers(listData);
    
    // Fetch associated association if it exists
    if (listData.association_id) {
        const associations = await db`SELECT * FROM association WHERE id = ${listData.association_id}`;
        if (associations.length > 0) {
            const assocData: RawAssociation = associations[0];
            listWithMembers.association = {
                id: assocData.id,
                handle: assocData.handle,
                name: assocData.name,
                description: assocData.description,
                icon: `/api/icons/${assocData.icon}`,
                color: assocData.color,
                members: []
            };
        }
    }
    
    return json(listWithMembers);

};