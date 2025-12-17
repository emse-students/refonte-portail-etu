import type { List, RawEvent, Role } from "$lib/databasetypes";
import { resolve } from "$app/paths";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
	event.depends("app:list");
	const list: List = await event
		.fetch(resolve(`/api/lists/handle/${event.params.handle}`))
		.then((res) => res.json());

	// Fetch events for the list
	const events: RawEvent[] = await event
		.fetch(`${resolve("/api/calendar")}?list=${list.id}`)
		.then((res) => res.json());

	// Fetch roles
	const roles: Role[] = await event.fetch(resolve("/api/roles")).then((res) => res.json());

	return {
		list,
		roles,
		events,
	};
};
