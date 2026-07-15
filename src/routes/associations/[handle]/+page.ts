import type { PageLoad } from "./$types";
import { getAssociationBySlug } from "$lib/canari";
import { error } from "@sveltejs/kit";
import { m } from "$lib/paraglide/messages";

/** One association with its public members, resolved by slug. */
export const load: PageLoad = async ({ fetch, params }) => {
	try {
		const association = await getAssociationBySlug(fetch, params.handle);
		return { association };
	} catch {
		throw error(404, m.error_association_not_found());
	}
};
