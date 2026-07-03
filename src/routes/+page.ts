import type { PageLoad } from "./$types";
import { getAssociations } from "$lib/canari";

/**
 * Home data: active (non-archived) associations, used to preview the associative
 * life on the landing page. Failures degrade to an empty list so the static
 * hero and links still render.
 */
export const load: PageLoad = async ({ fetch }) => {
	try {
		const associations = await getAssociations(fetch, "association");
		return { associations: associations.filter((a) => !a.archived) };
	} catch {
		return { associations: [] };
	}
};
