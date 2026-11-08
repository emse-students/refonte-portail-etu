import { PUBLIC_CANARI_CARTE_SPACE, PUBLIC_CANARI_URL } from "$app/env/public";
import type { CanariAssociation, CanariAssociationDetail, PublishedCarte } from "#lib/types";
import { OUTBOUND_BUDGET_MS } from "#lib/outbound";

/**
 * Base URL of the public Canari instance. Overridable at runtime via the
 * PUBLIC_CANARI_URL env var (bun adapter reads it without a rebuild); defaults
 * to production. Used for both the read-only API and public media (logos).
 */
export const CANARI_URL = (PUBLIC_CANARI_URL || "https://canari.emse.fr").replace(/\/$/, "");

/** Absolute URL of the public read-only API root. */
const API = `${CANARI_URL}/api/public`;

/** SvelteKit's load `fetch`, passed through so SSR requests are traced/deduped. */
type Fetch = typeof globalThis.fetch;

/**
 * A call to the public API that did not return data, carrying WHY as a value.
 *
 * `status` is the API's own status code, or `null` when the request never got an answer at all -
 * a timeout, a DNS failure, a refused connection. That distinction is the whole point of the type:
 * a 404 is the API ANSWERING that a slug does not exist, and a timeout is the API saying nothing.
 * A page that turns both into its own 404 tells a crawler to deindex a page that exists, over a
 * blip. Never classify by reading the message - the caller reads `status`.
 */
export class CanariApiError extends Error {
	constructor(
		readonly status: number | null,
		readonly url: string,
		cause?: unknown,
		/** The typed refusal code the API answered with (`{ code }` in its body), when it gave one. */
		readonly code: string | null = null
	) {
		super(`Canari public API ${status ?? "unreachable"}${code ? ` (${code})` : ""} for ${url}`);
		this.name = "CanariApiError";
		this.cause = cause;
	}

	/** True when the API answered, and its answer was that this resource does not exist. */
	get isAbsent(): boolean {
		return this.status === 404;
	}
}

/**
 * Throws a {@link CanariApiError} when the public API is unreachable or errors out.
 *
 * The budget matters on both sides of the render: a fetch with no deadline never throws, and the
 * loaders are built to degrade on a THROW - they return empty data with a `failed` flag. Without it
 * a client render would sit on its loading state and a server render would hold the response open,
 * neither of which anything downstream handles.
 */
async function getJson<T>(fetch: Fetch, url: string): Promise<T> {
	let res: Response;
	try {
		res = await fetch(url, { signal: AbortSignal.timeout(OUTBOUND_BUDGET_MS) });
	} catch (e) {
		// No answer at all. `status: null` is what separates this from a 404 downstream.
		throw new CanariApiError(null, url, e);
	}
	if (!res.ok) {
		throw new CanariApiError(res.status, url);
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

/**
 * The Canari space whose carte this showcase shows, as `<formation>:<campus>` (for example
 * `ICM:saint-etienne`), or null when the deployment names none. Canari keeps one live carte PER
 * SPACE, so the showcase must say which one it wants; with no space it shows no map at all - there is
 * deliberately no fallback to "whatever is live".
 */
export const CARTE_SPACE = PUBLIC_CANARI_CARTE_SPACE?.trim() || null;

/** Publication schema this showcase renders. See {@link PublishedCarte.version}. */
const CARTE_VERSION = 2;

/**
 * Member-card padding (both sides) as it was when every card in a slot had the same width. Only used
 * to read a v2 map published before Canari began sizing cards per name - see below.
 */
const LEGACY_CARD_PAD_X = 12;

/**
 * The "Carte de la Vie Asso" Canari currently has live for this showcase's space, or null when there
 * is none - or when the deployment names no space (`PUBLIC_CANARI_CARTE_SPACE`), which is logged.
 *
 * A 404 is the documented answer for "nothing is published", not a failure: only an admin ever
 * publishes a map, and the association directory has to render whether or not one exists. Any other
 * status still throws, so a broken API is not silently indistinguishable from an empty one.
 *
 * A payload from an older schema is treated as "nothing published" rather than rendered partially:
 * v1 carried fractions of the frame and no members, so the map it produces is not the poster. It is
 * logged, though - the poster is still in Canari, and one republish fixes it, so a silent empty spot
 * would be the wrong way to find out.
 *
 * Within v2, one field is read for compatibility rather than required, so that the map does not need
 * the two repositories to be deployed in a particular order. See the loop below.
 */
export async function getPublishedCarte(
	fetch: Fetch,
	space: string | null = CARTE_SPACE
): Promise<PublishedCarte | null> {
	if (!space) {
		console.error(
			"PUBLIC_CANARI_CARTE_SPACE is not set - no carte is shown. Name the Canari space " +
				"(`<formation>:<campus>`) in the deployment's .env."
		);
		return null;
	}
	const url = `${API}/carte?space=${encodeURIComponent(space)}`;
	let res: Response;
	try {
		res = await fetch(url, { signal: AbortSignal.timeout(OUTBOUND_BUDGET_MS) });
	} catch (e) {
		throw new CanariApiError(null, url, e);
	}
	if (res.status === 404) return null;
	if (!res.ok) {
		// A 400 carries a typed code (`CARTE_PUBLIC_SPACE_INVALID` for a misnamed space): it travels
		// as a value, so the log names it without anyone parsing a message.
		const body = (await res.json().catch(() => null)) as { code?: unknown } | null;
		throw new CanariApiError(
			res.status,
			url,
			undefined,
			typeof body?.code === "string" ? body.code : null
		);
	}
	const carte = (await res.json()) as PublishedCarte;
	if (carte.version !== CARTE_VERSION || !Array.isArray(carte.units)) {
		console.warn(
			`Published carte is schema v${carte.version}, this showcase renders v${CARTE_VERSION} - ` +
				"omitting the map. Republish it from the Canari carte editor."
		);
		return null;
	}
	// A v2 map published before Canari sized member cards per name carries no `photo`. Back then every
	// card in a slot had the same width, so the photo WAS the card minus its padding - this is a
	// faithful read of that document, not a guess. It keeps the renderer free of the question, and it
	// means the two repos can be deployed in either order.
	for (const unit of carte.units) {
		for (const card of unit.cards ?? []) {
			if (typeof card.photo !== "number") card.photo = card.w - LEGACY_CARD_PAD_X;
		}
	}
	return carte;
}

/**
 * The live carte for a page that renders without it: a failure is LOGGED with its status and code,
 * then answered null, so a misnamed space (a 400) or an outage never passes silently and never costs
 * the page its other content.
 *
 * @param where - The caller, named in the log line.
 */
export async function getPublishedCarteOrNull(
	fetch: Fetch,
	where: string
): Promise<PublishedCarte | null> {
	try {
		return await getPublishedCarte(fetch);
	} catch (e) {
		const status = e instanceof CanariApiError ? (e.status ?? "unreachable") : "unknown";
		const code = e instanceof CanariApiError ? (e.code ?? "none") : "none";
		console.error(`[carte] ${where}: no map - Canari answered ${status}, code ${code}`, e);
		return null;
	}
}

/** One association or list by slug, including its public members. */
export function getAssociationBySlug(fetch: Fetch, slug: string): Promise<CanariAssociationDetail> {
	return getJson<CanariAssociationDetail>(
		fetch,
		`${API}/associations/slug/${encodeURIComponent(slug)}`
	);
}
