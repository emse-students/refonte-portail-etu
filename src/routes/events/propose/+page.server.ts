import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { Association } from "$lib/databasetypes";
import { requireAuth, getAuthorizedAssociationIds } from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";
import db from "$lib/server/database";

export const load: PageServerLoad = async (event) => {
	const user = await requireAuth(event);
	if (!user) {
		throw redirect(302, "/api/auth/login");
	}

	const authorizedIds = getAuthorizedAssociationIds(user, Permission.EVENTS);

	let associations: Association[] = [];
	if (authorizedIds === null) {
		// Global admin: fetch all associations
		associations = await db`SELECT id, name, handle FROM association ORDER BY name ASC`;
	} else if (authorizedIds.length > 0) {
		associations = await db`
            SELECT id, name, handle 
            FROM association 
            WHERE id = ANY(${authorizedIds}) 
            ORDER BY name ASC
        `;
	}

	return {
		associations,
	};
};
