import type { List } from "$lib/databasetypes";
import { resolve } from "$app/paths";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
	const list: List = await event
		.fetch(resolve(`/api/lists/handle/${event.params.handle}`))
		.then((res) => res.json());

	return {
		list,
	};
};
