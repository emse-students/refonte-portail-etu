import type { PageLoad } from "./$types";
import { getAssociations } from "$lib/canari";

/** All associations (active + archived) for the directory page. Degrades to an empty list on API failure. */
export const load: PageLoad = async ({ fetch }) => {
	try {
		const associations = await getAssociations(fetch, "association");
		return { associations, failed: false };
	} catch {
		return { associations: [], failed: true };
	}
};
