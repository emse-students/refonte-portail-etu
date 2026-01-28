import { json } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { RequestEvent } from "./$types";

export const GET = async ({ params }: RequestEvent) => {
	const userId = params.id;

	const roles = await db`
        SELECT
            m.role_name as role_name,
            m.permissions,
            a.name as association_name,
            l.name as list_name
        FROM
            member m
        LEFT JOIN association a ON m.association_id = a.id
        LEFT JOIN list l ON m.list_id = l.id
        WHERE
            m.user_id = ${userId}
    `;

	return json(roles);
};
