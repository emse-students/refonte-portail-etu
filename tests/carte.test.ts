import { describe, it, expect, vi, afterEach } from "vitest";
import { getPublishedCarte } from "$lib/canari";
import { load } from "../src/routes/associations/+page";
import type { PublishedCarte } from "$lib/types";

/**
 * The published Carte de la Vie Asso is optional by design: most of the time Canari has none live,
 * and the association directory has to render either way. That makes "404 means nothing is
 * published" and "each fetch degrades on its own" the two rules worth pinning down - both are
 * invisible in the happy path and both would silently cost the visitor the whole directory if a
 * later refactor folded the carte into the same try/catch as the association list.
 *
 * The third rule is the schema gate: a map from an older publication is NOT rendered partially, and
 * the reason is logged rather than left as an unexplained empty spot on the page.
 */

/** A minimal but complete published map, shaped exactly as `GET /api/public/carte` returns it. */
const CARTE: PublishedCarte = {
	version: 2,
	aspectRatio: 1.41421,
	stage: { w: 1600, h: 1131 },
	background: { dataUrl: null, scrimOpacity: 0 },
	style: {
		pageBg: "#fdf3e3",
		scrimColor: "#3a2a12",
		cardBg: "#ffffff",
		cardTextColor: "#374151",
		directoryBg: "rgba(255,255,255,0.86)",
		directoryTextColor: "#1f2937",
		directoryMutedColor: "#6b7280",
	},
	title: null,
	units: [
		{
			assoId: "asso-1",
			x: 120,
			y: 240,
			w: 400,
			h: 430,
			scale: 0.6,
			z: 1,
			color: null,
			colorFallback: "#e09f3e",
			blob: { x: 95, y: 67, size: 210, radius: "50%" },
			logo: { x: 154, y: 88, w: 92, h: 92, radius: "50%", initialsSize: 36, initials: "A1" },
			name: { x: 123, y: 184, w: 154, size: 15, emailSize: 5.25 },
			cards: [],
		},
	],
	texts: [],
	directory: null,
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

afterEach(() => {
	vi.restoreAllMocks();
});

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

	// A v1 document has no resolved geometry and no members: rendering it would draw an
	// approximation of a hand-composed poster, which is exactly what v2 exists to stop.
	it("omits an older publication instead of rendering it partially, and says so", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const v1 = { version: 1, aspectRatio: 1.41421, bubbles: [{ assoId: "asso-1" }], texts: [] };
		expect(await getPublishedCarte(stubFetch({ "/carte": { status: 200, body: v1 } }))).toBeNull();
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("v1"));
	});

	it("omits a v2 payload whose units did not survive the wire", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const broken = { ...CARTE, units: undefined };
		expect(
			await getPublishedCarte(stubFetch({ "/carte": { status: 200, body: broken } }))
		).toBeNull();
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
