import type { PageLoad } from "./$types";
import { CanariApiError, getAssociationBySlug } from "$lib/canari";
import { error } from "@sveltejs/kit";
import { m } from "$lib/paraglide/messages";

/**
 * One promo list with its public members, resolved by slug.
 *
 * Same split as the association page: an API 404 means the slug is gone and 404 is the honest
 * answer; anything else means the API did not answer, and 503 is what says "ask again" instead of
 * telling a search engine to drop a page that exists.
 */
export const load: PageLoad = async ({ fetch, params }) => {
	try {
		const list = await getAssociationBySlug(fetch, params.handle);
		return { list };
	} catch (e) {
		if (e instanceof CanariApiError && !e.isAbsent) {
			// The only trace a 503 leaves. Under SSR nobody sees the browser console, and a page
			// that answers "ask again" without saying what it asked is a support ticket with no
			// evidence in it.
			console.warn(`[list] upstream unavailable for "${params.handle}": ${e.message}`, e.cause);
			throw error(503, m.error_upstream_unavailable());
		}
		if (!(e instanceof CanariApiError)) {
			console.warn(`[list] unclassified failure for "${params.handle}"`, e);
		}
		throw error(404, m.error_list_not_found());
	}
};
