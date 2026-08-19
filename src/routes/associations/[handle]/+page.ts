import type { PageLoad } from "./$types";
import { CanariApiError, getAssociationBySlug } from "$lib/canari";
import { error } from "@sveltejs/kit";
import { m } from "$lib/paraglide/messages";

/**
 * One association with its public members, resolved by slug.
 *
 * The two failure modes are answered differently, and under SSR that difference is what a crawler
 * reads: a 404 is the API saying this slug does not exist, and a 404 back is correct. Anything else
 * - a timeout, a 502, no answer at all - is the API saying nothing, and answering 404 to that tells
 * a search engine to deindex a page that exists, over a blip. 503 is the status that means "ask
 * again", and it is what both a crawler and a visitor need here.
 */
export const load: PageLoad = async ({ fetch, params }) => {
	try {
		const association = await getAssociationBySlug(fetch, params.handle);
		return { association };
	} catch (e) {
		if (e instanceof CanariApiError && !e.isAbsent) {
			// The only trace a 503 leaves. Under SSR nobody sees the browser console, and a page
			// that answers "ask again" without saying what it asked is a support ticket with no
			// evidence in it.
			console.warn(
				`[association] upstream unavailable for "${params.handle}": ${e.message}`,
				e.cause
			);
			throw error(503, m.error_upstream_unavailable());
		}
		if (!(e instanceof CanariApiError)) {
			console.warn(`[association] unclassified failure for "${params.handle}"`, e);
		}
		throw error(404, m.error_association_not_found());
	}
};
