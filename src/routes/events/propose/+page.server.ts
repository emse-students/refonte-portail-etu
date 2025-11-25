import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { Association, List } from "$lib/databasetypes";
import {
	requireAuth,
	getAuthorizedAssociationIds,
	getAuthorizedListIds,
} from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";
import db from "$lib/server/database";

export const load: PageServerLoad = async (event) => {
	const user = await requireAuth(event);
	if (!user) {
		throw redirect(302, "/auth/login");
	}

	const configRows = await db`SELECT value FROM config WHERE key_name = 'event_submission_open'`;
	const isOpen = configRows.length > 0 && configRows[0].value === "true";

	const authorizedAssocIds = getAuthorizedAssociationIds(user, Permission.EVENTS);
	const authorizedListIds = getAuthorizedListIds(user, Permission.EVENTS);

	// Check if submission is open
	if (authorizedAssocIds !== null) {
		if (!isOpen) {
			throw redirect(302, "/");
		}
	}

	let associations: Association[] = [];
	if (authorizedAssocIds === null) {
		// Global admin: fetch all associations
		associations = await db`SELECT id, name, handle FROM association`;
	} else if (authorizedAssocIds.length > 0) {
		// Fetch authorized associations
		associations = await db`
            SELECT id, name, handle 
            FROM association 
            WHERE id IN (${authorizedAssocIds}) 
            ORDER BY name ASC
        `;
	}

	let lists: List[] = [];
	if (authorizedListIds === null) {
		// Global admin: fetch all lists
		lists = await db`SELECT id, name, handle, association_id FROM list ORDER BY name ASC`;
	} else if (authorizedListIds.length > 0) {
		lists = await db`
            SELECT id, name, handle, association_id
            FROM list 
            WHERE id IN (${authorizedListIds}) 
            ORDER BY name ASC
        `;
	}

	lists = lists.sort((a, b) => a.name.localeCompare(b.name));
	associations = associations.sort((a, b) => a.name.localeCompare(b.name));

	return {
		isOpen,
		associations,
		lists,
	};
};
