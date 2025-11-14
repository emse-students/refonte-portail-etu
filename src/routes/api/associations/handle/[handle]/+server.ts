import type { RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { RawAssociation } from "$lib/databasetypes";
import { getAssociationWithMembers, getBasicAssociation } from "$lib/server/database";
import { json } from "@sveltejs/kit";

export const GET = async (event: RequestEvent) => {
    const id = event.params.id;
    const associations =
        await db`SELECT id, name, description FROM association WHERE id = ${id}`;

    if (associations.length === 0) {
        return new Response(
            JSON.stringify({ error: "Association not found" }),
            {
                status: 404,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    const associationData: RawAssociation = associations[0];


    const asso = await getAssociationWithMembers(associationData);
    return json(asso);

};