import type { PageLoad } from "./$types";
import { getAssociations } from "$lib/canari";

/** All promo lists for the lists directory. Degrades to an empty list on API failure. */
export const load: PageLoad = async ({ fetch }) => {
	try {
		const lists = await getAssociations(fetch, "list");
		return { lists, failed: false };
	} catch {
		return { lists: [], failed: true };
	}
};
