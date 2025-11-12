import { resolve } from "$app/paths";
import type { Association } from "$lib/databasetypes";
import type { PageLoad } from "./$types";

export const load: PageLoad = async (event) => {
	const associations: Association[] = await event.fetch(resolve("/api/associations")).then(res => res.json());

	console.log("Loaded associations");

	return {
		associations: associations,
	};
}