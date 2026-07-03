import type { PageLoad } from "./$types";
import { getAssociations } from "$lib/canari";

/** All associations (active + archived) for the directory page. */
export const load: PageLoad = async ({ fetch }) => {
	const associations = await getAssociations(fetch, "association");
	return { associations };
};
