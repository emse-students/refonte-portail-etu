import type { PageServerLoad } from "./$types";
import db, { getPool } from "$lib/server/database";
import type { ConfigRow } from "$lib/databasetypes";
import { fetchEvents } from "$lib/server/events";
import { getAuthorizedAssociationIds, getAuthorizedListIds } from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";

export const load: PageServerLoad = async (event) => {
	let eventSubmissionOpen = false;
	try {
		// Ensure table exists (just in case)
		await getPool().query(`
            CREATE TABLE IF NOT EXISTS config (
                key_name VARCHAR(255) PRIMARY KEY,
                value VARCHAR(255)
            )
        `);

		const rows =
			await db<ConfigRow>`SELECT value FROM config WHERE key_name = 'event_submission_open'`;
		if (rows.length > 0) {
			eventSubmissionOpen = rows[0].value === "true";
		}
	} catch (e) {
		console.error("Error fetching config:", e);
	}

	// Calculate date range for initial calendar view (4 weeks starting from current week)
	const now = new Date();
	const day = (now.getDay() + 6) % 7;
	const start = new Date(now);
	start.setDate(start.getDate() - day);
	start.setHours(0, 0, 0, 0);

	const end = new Date(start);
	end.setDate(end.getDate() + 28); // 4 weeks

	// Get user for permissions
	const user = event.locals?.userData || null;

	let canSeeAllUnvalidated = false;
	let authorizedAssociationIds: number[] = [];
	let authorizedListIds: number[] = [];

	if (user) {
		const authAssocs = getAuthorizedAssociationIds(user, Permission.MANAGE);
		const authLists = getAuthorizedListIds(user, Permission.MANAGE);

		if (authAssocs === null || authLists === null) {
			// Global admin
			canSeeAllUnvalidated = true;
		} else {
			authorizedAssociationIds = authAssocs;
			authorizedListIds = authLists;
		}
	}

	const initialEvents = await fetchEvents({
		start,
		end,
		requestUnvalidated: true, // Homepage requests unvalidated events
		user,
		authorizedAssociationIds,
		authorizedListIds,
		canSeeAllUnvalidated,
	});

	return {
		eventSubmissionOpen,
		initialEvents: JSON.parse(JSON.stringify(initialEvents)), // Serialize dates
		start, // Pass the start date used for fetching to ensure consistency
	};
};
