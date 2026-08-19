import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CanariAssociation } from "$lib/types";

vi.mock("$lib/canari", () => ({ getAssociations: vi.fn() }));

import { getAssociations } from "$lib/canari";
import { GET } from "../src/routes/sitemap.xml/+server";

/**
 * `robots.txt` has advertised `/sitemap.xml` since the portal shipped and it answered 404 - measured
 * on prod 2026-08-19. The rules worth pinning are the ones that would put it back in that state
 * without anybody noticing, because a sitemap is read by machines only:
 *
 * - an upstream failure must SHORTEN the document, never break it: a crawler treats a 500 or an
 *   XML parse error as a reason to stop asking, and the four static routes are worth serving alone;
 * - the detail URLs must actually be in it - they exist nowhere else a crawler can reach, since the
 *   directory links are rendered from data;
 * - an ampersand in a slug must not end the document early.
 */

function assoc(slug: string, over: Partial<CanariAssociation> = {}): CanariAssociation {
	return {
		id: slug,
		slug,
		name: slug.toUpperCase(),
		description: null,
		bioMarkdown: null,
		logoUrl: null,
		logoMediaId: null,
		color: null,
		type: "association",
		promo: null,
		parentAssociationId: null,
		archived: false,
		...over,
	} as CanariAssociation;
}

const mocked = vi.mocked(getAssociations);

/** Calls the handler the way SvelteKit does, and returns the body. */
async function render(): Promise<string> {
	const res = await GET({
		fetch: vi.fn(),
		url: new URL("https://portail-etu.emse.fr/sitemap.xml"),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any);
	return res.text();
}

beforeEach(() => {
	mocked.mockReset();
});

describe("GET /sitemap.xml", () => {
	it("lists the static routes and every live association and list", async () => {
		mocked.mockImplementation((_f, type) =>
			Promise.resolve(
				type === "association" ? [assoc("bde")] : [assoc("promo-2027", { type: "list" })]
			)
		);

		const body = await render();
		for (const loc of [
			"https://portail-etu.emse.fr/",
			"https://portail-etu.emse.fr/associations",
			"https://portail-etu.emse.fr/lists",
			"https://portail-etu.emse.fr/liens",
			"https://portail-etu.emse.fr/associations/bde",
			"https://portail-etu.emse.fr/lists/promo-2027",
		]) {
			expect(body).toContain(`<loc>${loc}</loc>`);
		}
	});

	it("keeps archived entities out - still reachable, just not advertised", async () => {
		mocked.mockResolvedValue([assoc("bde"), assoc("vieux-club", { archived: true })]);

		const body = await render();
		expect(body).toContain("/associations/bde");
		expect(body).not.toContain("vieux-club");
	});

	it("still serves the static routes when the API is unreachable", async () => {
		mocked.mockRejectedValue(new Error("upstream down"));

		const res = await GET({
			fetch: vi.fn(),
			url: new URL("https://portail-etu.emse.fr/sitemap.xml"),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toContain("application/xml");

		const body = await res.text();
		expect(body).toContain("<loc>https://portail-etu.emse.fr/</loc>");
		expect(body).toContain("</urlset>");
	});

	it("degrades one half at a time - a broken list feed does not cost the associations", async () => {
		mocked.mockImplementation((_f, type) =>
			type === "association"
				? Promise.resolve([assoc("bde")])
				: Promise.reject(new Error("upstream down"))
		);

		const body = await render();
		expect(body).toContain("/associations/bde");
		expect(body).not.toContain("/lists/");
	});

	it("escapes a slug that would otherwise end the document early", async () => {
		mocked.mockImplementation((_f, type) =>
			Promise.resolve(type === "association" ? [assoc("a&b<c")] : [])
		);

		const body = await render();
		expect(body).toContain("/associations/a&amp;b&lt;c");
		expect(body).not.toContain("a&b<c");
	});

	it("is served with a cache window, so a crawler is not a load source", async () => {
		mocked.mockResolvedValue([]);

		const res = await GET({
			fetch: vi.fn(),
			url: new URL("https://portail-etu.emse.fr/sitemap.xml"),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);
		expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600");
	});
});
