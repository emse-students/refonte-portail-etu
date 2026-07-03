import type { PageLoad } from "./$types";
import { getAssociations } from "$lib/canari";

/** All promo lists for the lists directory (grouped by promo in the page). */
export const load: PageLoad = async ({ fetch }) => {
	const lists = await getAssociations(fetch, "list");
	return { lists };
};
