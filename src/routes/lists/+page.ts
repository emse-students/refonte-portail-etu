import { resolve } from "$app/paths";
import type { List } from "$lib/databasetypes";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
	const lists: List[] = await event.fetch(resolve("/api/lists")).then((res) => res.json());

	return {
		lists: lists,
	};
};
