import { env } from "$env/dynamic/public";
import type { CanariAssociation, CanariAssociationDetail, PublishedCarte } from "$lib/types";

/**
 * Base URL of the public Canari instance. Overridable at runtime via the
 * PUBLIC_CANARI_URL env var (bun adapter reads it without a rebuild); defaults
 * to production. Used for both the read-only API and public media (logos).
 */
export const CANARI_URL = (env.PUBLIC_CANARI_URL || "https://canari-emse.fr").replace(/\/$/, "");

/** Absolute URL of the public read-only API root. */
const API = `${CANARI_URL}/api/public`;

/** SvelteKit's load `fetch`, passed through so SSR requests are traced/deduped. */
type Fetch = typeof globalThis.fetch;

/** Throws a readable error when the public API is unreachable or errors out. */
async function getJson<T>(fetch: Fetch, url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Canari public API ${res.status} for ${url}`);
	}
	return (await res.json()) as T;
}

/** All associations (`type="association"`) or promo lists (`type="list"`); both when omitted. */
export function getAssociations(
	fetch: Fetch,
	type?: "association" | "list"
): Promise<CanariAssociation[]> {
	const qs = type ? `?type=${type}` : "";
	return getJson<CanariAssociation[]>(fetch, `${API}/associations${qs}`);
}

/** Publication schema this showcase renders. See {@link PublishedCarte.version}. */
const CARTE_VERSION = 2;

/**
 * The "Carte de la Vie Asso" Canari currently has live, or null when there is none.
 *
 * A 404 is the documented answer for "nothing is published", not a failure: only an admin ever
 * publishes a map, and the association directory has to render whether or not one exists. Any other
 * status still throws, so a broken API is not silently indistinguishable from an empty one.
 *
 * A payload from an older schema is treated as "nothing published" rather than rendered partially:
 * v1 carried fractions of the frame and no members, so the map it produces is not the poster. It is
 * logged, though - the poster is still in Canari, and one republish fixes it, so a silent empty spot
 * would be the wrong way to find out.
 */
export async function getPublishedCarte(fetch: Fetch): Promise<PublishedCarte | null> {
	const res = await fetch(`${API}/carte`);
	if (res.status === 404) return null;
	if (!res.ok) {
		throw new Error(`Canari public API ${res.status} for ${API}/carte`);
	}
	const carte = (await res.json()) as PublishedCarte;
	if (carte.version !== CARTE_VERSION || !Array.isArray(carte.units)) {
		console.warn(
			`Published carte is schema v${carte.version}, this showcase renders v${CARTE_VERSION} - ` +
				"omitting the map. Republish it from the Canari carte editor."
		);
		return null;
	}
	return carte;
}

/** One association or list by slug, including its public members. */
export function getAssociationBySlug(fetch: Fetch, slug: string): Promise<CanariAssociationDetail> {
	return getJson<CanariAssociationDetail>(
		fetch,
		`${API}/associations/slug/${encodeURIComponent(slug)}`
	);
}
