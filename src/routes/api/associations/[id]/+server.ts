import type { RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { Association, AssociationDB } from "$lib/databasetypes";

export const GET = async (event: RequestEvent) => {
	const id = event.params.id;
	const associations =
		await db`SELECT id, name, description FROM associations WHERE id = ${id}`;
	
	if (associations.length === 0) {
		return new Response(
			JSON.stringify({ error: "Association not found" }),
			{
				status: 404,
				headers: { "Content-Type": "application/json" },
			}
		);
	}

	const associationData: AssociationDB = associations[0];

    const data =
		await db`SELECT * FROM users u
                             JOIN user_roles ur ON u.id = ur.user_id
                             WHERE ur.association_id = ${id}`;

   const association = {
    members:  data.map((row: { id: number; name: string; email: string; role_id: number; role_name: string; role_permissions: number; }) => ({
       user: {
           id: row.id,
           name: row.name,
           email: row.email,
       },
       role: {
           id: row.role_id,
           name: row.role_name,
           permissions: row.role_permissions,
       },
       association: association.id,
   })),
   ...associationData,
   } as Association;

	return new Response(JSON.stringify(associations[0]), {
		headers: { "Content-Type": "application/json" },
	});
};
