import type { Association, RawEvent, Role } from "$lib/databasetypes";
import { resolve } from "$app/paths";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
	event.depends("app:association");
	const association: Association = await event
		.fetch(resolve(`/api/associations/handle/${event.params.handle}`))
		.then((res) => res.json());

	// Fetch events for the association
	const events: RawEvent[] = await event
		.fetch(`${resolve("/api/calendar")}?asso=${association.id}`)
		.then((res) => res.json());

	// Fetch roles
	const roles: Role[] = await event.fetch(resolve("/api/roles")).then((res) => res.json());

	return {
		association,
		events,
		roles,
	};
};
