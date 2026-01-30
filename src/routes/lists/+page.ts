import { resolve } from "$app/paths";
import type { Association, List } from "$lib/databasetypes";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
	const lists: List[] = await event.fetch(resolve("/api/lists")).then((res) => res.json());
	const assos: Association[] = await event
		.fetch(resolve("/api/associations"))
		.then((res) => res.json());

	return {
		lists: lists,
		associations: assos,
	};
};
