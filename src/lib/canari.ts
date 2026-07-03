import { env } from "$env/dynamic/public";
import type { CanariAssociation, CanariAssociationDetail } from "$lib/types";

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

/** One association or list by slug, including its public members. */
export function getAssociationBySlug(fetch: Fetch, slug: string): Promise<CanariAssociationDetail> {
	return getJson<CanariAssociationDetail>(
		fetch,
		`${API}/associations/slug/${encodeURIComponent(slug)}`
	);
}
