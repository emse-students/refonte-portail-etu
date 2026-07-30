import type { PageLoad } from "./$types";
import { getAssociations, getPublishedCarte } from "$lib/canari";

/**
 * All associations (active + archived) for the directory page, plus the Carte de la Vie Asso when
 * Canari has one live.
 *
 * The two degrade independently: the list to an empty array plus `failed`, the carte to null. A map
 * is a bonus above the directory, so neither its absence (the usual case - `getPublishedCarte`
 * already returns null on 404) nor a failure fetching it may cost the visitor the association list.
 */
export const load: PageLoad = async ({ fetch }) => {
	const [associations, carte] = await Promise.all([
		getAssociations(fetch, "association").catch(() => null),
		getPublishedCarte(fetch).catch(() => null),
	]);
	return { associations: associations ?? [], failed: associations === null, carte };
};
