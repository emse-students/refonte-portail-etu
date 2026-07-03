import type { PageLoad } from "./$types";
import { getAssociationBySlug } from "$lib/canari";
import { error } from "@sveltejs/kit";

/** One association with its public members, resolved by slug. */
export const load: PageLoad = async ({ fetch, params }) => {
	try {
		const association = await getAssociationBySlug(fetch, params.handle);
		return { association };
	} catch {
		throw error(404, "Association introuvable");
	}
};
