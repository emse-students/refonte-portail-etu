import type { PageLoad } from "./$types";
import { getAssociations } from "$lib/canari";

/**
 * Home data: active (non-archived) associations previewed on the landing page,
 * plus the total number of campaign lists for the hero stats. Failures degrade
 * to empty values so the static hero and links still render.
 */
export const load: PageLoad = async ({ fetch }) => {
	try {
		const [associations, lists] = await Promise.all([
			getAssociations(fetch, "association"),
			getAssociations(fetch, "list"),
		]);
		return {
			associations: associations.filter((a) => !a.archived),
			listCount: lists.length,
		};
	} catch {
		return { associations: [], listCount: 0 };
	}
};
