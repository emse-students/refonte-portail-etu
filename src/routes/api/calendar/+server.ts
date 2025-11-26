import type { RequestEvent } from "@sveltejs/kit";

// GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD

import { escape, getPool } from "$lib/server/database";
import { json } from "@sveltejs/kit";
import type { RawEvent } from "$lib/databasetypes";
import {
	requireAuth,
	getAuthorizedAssociationIds,
	getAuthorizedListIds,
} from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";

export async function GET(event: RequestEvent) {
	const startParam = event.url.searchParams.get("start");
	const endParam = event.url.searchParams.get("end");
	const assocIdParam = event.url.searchParams.get("asso");
	const listIdParam = event.url.searchParams.get("list");
	const requestUnvalidated = event.url.searchParams.get("unvalidated") === "true";
	const requestAll = event.url.searchParams.get("all") === "true";

	// Validation et préparation des paramètres
	const start = startParam ? new Date(startParam) : null;
	const end = endParam ? new Date(endParam) : null;
	const assocId = assocIdParam ? Number(assocIdParam) : null;
	const listId = listIdParam ? Number(listIdParam) : null;

	const hasStart = start && !isNaN(start.getTime());
	const hasEnd = end && !isNaN(end.getTime());
	const hasAssoc = assocId && assocId > 0;
	const hasList = listId && listId > 0;

	// Check permissions to see unvalidated events
	const user = await requireAuth(event);
	let canSeeAllUnvalidated = false;
	let authorizedAssociationIds: number[] = [];
	let authorizedListIds: number[] = [];

	if (user) {
		const authAssocs = getAuthorizedAssociationIds(user, Permission.EVENTS);
		const authLists = getAuthorizedListIds(user, Permission.EVENTS);

		if (authAssocs === null || authLists === null) {
			// Global admin
			canSeeAllUnvalidated = true;
		} else {
			authorizedAssociationIds = authAssocs;
			authorizedListIds = authLists;
		}
	}

	// Construction dynamique des conditions SQL avec escape
	const conditions: string[] = ["1=1"];

	if (hasStart) {
		conditions.push(`e.start_date >= ${escape(start!.toISOString())}`);
	}
	if (hasEnd) {
		conditions.push(`e.end_date <= ${escape(end!.toISOString())}`);
	}
	if (hasAssoc) {
		conditions.push(`e.association_id = ${escape(assocId!)}`);
	}
	if (hasList) {
		conditions.push(`e.list_id = ${escape(listId!)}`);
	}

	if (!requestUnvalidated) {
		conditions.push("e.validated = 1");
	} else {
		if (requestAll && user) {
			// Global admin or proposition page sees everything
		} else {
			if (canSeeAllUnvalidated) {
				// Global admin sees everything
			} else {
				const orConditions = ["e.validated = 1"];

				if (authorizedAssociationIds.length > 0) {
					orConditions.push(`e.association_id IN (${authorizedAssociationIds.join(",")})`);
				}
				if (authorizedListIds.length > 0) {
					orConditions.push(`e.list_id IN (${authorizedListIds.join(",")})`);
				}

				conditions.push(`(${orConditions.join(" OR ")})`);
			}
		}
	}

	const whereClause = conditions.join(" AND ");

	const rows = (
		await getPool()!.query(`
        SELECT 
            e.id, e.title, e.start_date, e.end_date, e.description, e.location, e.association_id, e.list_id, e.validated,
            a.name as association_name, a.color as association_color,
            l.name as list_name, l.color as list_color
        FROM event e
        LEFT JOIN association a ON e.association_id = a.id
        LEFT JOIN list l ON e.list_id = l.id
        WHERE ${whereClause}
        ORDER BY e.start_date ASC
    `)
	)[0] as RawEvent[];

	return json(rows, {
		headers: {
			"Cache-Control": "no-store, max-age=0",
		},
	});
}
