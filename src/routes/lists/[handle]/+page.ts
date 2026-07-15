import type { PageLoad } from "./$types";
import { getAssociationBySlug } from "$lib/canari";
import { error } from "@sveltejs/kit";
import { m } from "$lib/paraglide/messages";

/** One promo list with its public members, resolved by slug. */
export const load: PageLoad = async ({ fetch, params }) => {
	try {
		const list = await getAssociationBySlug(fetch, params.handle);
		return { list };
	} catch {
		throw error(404, m.error_list_not_found());
	}
};
