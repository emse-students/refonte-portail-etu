import { describe, it, expect } from "vitest";
import { getPublishedCarte } from "$lib/canari";
import { load } from "../src/routes/associations/+page";
import type { PublishedCarte } from "$lib/types";

/**
 * The published Carte de la Vie Asso is optional by design: most of the time Canari has none live,
 * and the association directory has to render either way. That makes "404 means nothing is
 * published" and "each fetch degrades on its own" the two rules worth pinning down - both are
 * invisible in the happy path and both would silently cost the visitor the whole directory if a
 * later refactor folded the carte into the same try/catch as the association list.
 */

/** A minimal but complete published map, shaped exactly as `GET /api/public/carte` returns it. */
const CARTE: PublishedCarte = {
	version: 1,
	aspectRatio: 1.41421,
	background: { dataUrl: null, scrimOpacity: 0 },
	titleColor: null,
	bubbles: [
		{
			assoId: "asso-1",
			x: 0.1,
			y: 0.2,
			w: 0.12,
			z: 1,
			color: null,
			radius: "50%",
			logoRadius: "50%",
		},
	],
	texts: [],
};

/**
 * A `fetch` that answers by path fragment, so a test states only the statuses it cares about.
 *
 * @param routes - Path fragment -> the status and body to answer with.
 */
function stubFetch(routes: Record<string, { status: number; body?: unknown }>): typeof fetch {
	return (async (input: RequestInfo | URL) => {
		const url = String(input);
		const match = Object.keys(routes).find((key) => url.includes(key));
		const route = match ? routes[match] : { status: 404 };
		return {
			ok: route.status >= 200 && route.status < 300,
			status: route.status,
			json: async () => route.body,
		} as Response;
	}) as typeof fetch;
}

describe("getPublishedCarte", () => {
	it("returns the map when one is live", async () => {
		const carte = await getPublishedCarte(stubFetch({ "/carte": { status: 200, body: CARTE } }));
		expect(carte).toEqual(CARTE);
	});

	it("returns null on 404 rather than throwing", async () => {
		// Nothing published is the NORMAL state, not a failure: only an admin ever publishes a map.
		expect(await getPublishedCarte(stubFetch({ "/carte": { status: 404 } }))).toBeNull();
	});

	it("still throws on any other error status", async () => {
		// A broken API must stay distinguishable from an empty one, or an outage looks like a choice.
		await expect(getPublishedCarte(stubFetch({ "/carte": { status: 500 } }))).rejects.toThrow(
			/500/
		);
	});
});

describe("the association directory load", () => {
	/** Calls the page load with a stub fetch; the loader uses no other event field. */
	const run = (fetch: typeof globalThis.fetch) =>
		load({ fetch } as Parameters<typeof load>[0]) as Promise<{
			associations: unknown[];
			failed: boolean;
			carte: PublishedCarte | null;
		}>;

	it("loads both the associations and the live map", async () => {
		const data = await run(
			stubFetch({
				"/associations": { status: 200, body: [{ id: "asso-1" }] },
				"/carte": { status: 200, body: CARTE },
			})
		);
		expect(data.failed).toBe(false);
		expect(data.associations).toHaveLength(1);
		expect(data.carte).toEqual(CARTE);
	});

	it("keeps the directory when the map fetch fails", async () => {
		const data = await run(
			stubFetch({
				"/associations": { status: 200, body: [{ id: "asso-1" }] },
				"/carte": { status: 500 },
			})
		);
		expect(data.associations).toHaveLength(1);
		expect(data.failed).toBe(false);
		expect(data.carte).toBeNull();
	});

	it("keeps the map when the association fetch fails", async () => {
		const data = await run(
			stubFetch({
				"/associations": { status: 500 },
				"/carte": { status: 200, body: CARTE },
			})
		);
		expect(data.associations).toEqual([]);
		expect(data.failed).toBe(true);
		expect(data.carte).toEqual(CARTE);
	});
});
