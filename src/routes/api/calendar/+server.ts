import type { RequestEvent } from "@sveltejs/kit";

// GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD

import { json } from "@sveltejs/kit";
import {
	requireAuth,
	getAuthorizedAssociationIds,
	getAuthorizedListIds,
} from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";
import { fetchEvents } from "$lib/server/events";

export async function GET(event: RequestEvent) {
	const startParam = event.url.searchParams.get("start");
	const endParam = event.url.searchParams.get("end");
	const assocIdParam = event.url.searchParams.get("asso");
	const listIdParam = event.url.searchParams.get("list");
	const requestUnvalidated = event.url.searchParams.get("unvalidated") === "true";
	const requestAll = event.url.searchParams.get("all") === "true";

	// Validation et préparation des paramètres
	const start = startParam ? new Date(startParam) : undefined;
	const end = endParam ? new Date(endParam) : undefined;
	const assocId = assocIdParam ? Number(assocIdParam) : undefined;
	const listId = listIdParam ? Number(listIdParam) : undefined;

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

	const rows = await fetchEvents({
		start,
		end,
		assocId,
		listId,
		requestUnvalidated,
		requestAll,
		user,
		authorizedAssociationIds,
		authorizedListIds,
		canSeeAllUnvalidated,
	});

	return json(rows, {
		headers: {
			"Cache-Control": "no-store, max-age=0",
		},
	});
}
