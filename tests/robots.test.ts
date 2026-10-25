import { describe, it, expect, vi } from "vitest";
import { isApiPath, listsPeople, NOINDEX, sitemapEligible } from "#lib/robots";

vi.mock("#lib/paraglide/server", () => ({
	paraglideMiddleware: (
		req: Request,
		cb: (a: { request: Request; locale: string }) => Promise<Response>
	) => cb({ request: req, locale: "fr" }),
}));

import { handle } from "../src/hooks.server";

/**
 * Pages that print people's names must not be indexable, and the sitemap must not advertise them.
 * Both rules fail silently - a page is simply found by a name search a year later - so they are
 * pinned here (GDPR, docs/wiki/data-protection.md).
 */

describe("listsPeople", () => {
	it("is true for any member, false for none or no list at all", () => {
		expect(listsPeople({ members: [{}] })).toBe(true);
		expect(listsPeople({ members: [] })).toBe(false);
		expect(listsPeople({})).toBe(false);
		expect(listsPeople({ members: null })).toBe(false);
	});
});

describe("sitemapEligible", () => {
	it("keeps out anything with a member, errs on a missing count towards eligible only at zero", () => {
		expect(sitemapEligible({ memberCount: 0 })).toBe(true);
		expect(sitemapEligible({ memberCount: 1 })).toBe(false);
		expect(sitemapEligible({})).toBe(true);
	});
});

describe("isApiPath", () => {
	it("matches the API tree and nothing that merely starts with the letters", () => {
		expect(isApiPath("/api/users/u1/avatar")).toBe(true);
		expect(isApiPath("/api")).toBe(true);
		expect(isApiPath("/apiary")).toBe(false);
		expect(isApiPath("/associations")).toBe(false);
	});
});

describe("handle", () => {
	const run = (path: string) =>
		handle({
			event: {
				request: new Request(`https://x.test${path}`),
				url: new URL(`https://x.test${path}`),
			},
			resolve: () => Promise.resolve(new Response("ok")),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);

	it("marks the avatar proxy noindex", async () => {
		expect((await run("/api/users/u1/avatar")).headers.get("X-Robots-Tag")).toBe(NOINDEX);
	});

	it("leaves ordinary pages to their own loaders", async () => {
		expect((await run("/liens")).headers.get("X-Robots-Tag")).toBeNull();
	});
});
