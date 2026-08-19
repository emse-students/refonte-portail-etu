import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("$lib/canari", async () => {
	const actual = await vi.importActual<typeof import("$lib/canari")>("$lib/canari");
	return {
		CanariApiError: actual.CanariApiError,
		getAssociationBySlug: vi.fn(),
	};
});

import { CanariApiError, getAssociationBySlug } from "$lib/canari";
import { load as loadAssociation } from "../src/routes/associations/[handle]/+page";
import { load as loadList } from "../src/routes/lists/[handle]/+page";

/**
 * The two detail pages answered 404 for ANY upstream failure. That was invisible while the site was
 * a SPA - a visitor saw a not-found page either way and reloaded. Under SSR the same 404 is a
 * statement to a crawler that the page does not exist, and Google acts on it: a timeout during one
 * crawl would deindex an association that has been there for years.
 *
 * So the distinction is carried as a TYPE, not read out of a message: `CanariApiError.status` is the
 * API's own status, or `null` when there was no answer at all. Only `404` may become a 404.
 */

const mocked = vi.mocked(getAssociationBySlug);

/**
 * The two loaders have route-specific `PageLoad` types that share no supertype, so the table below
 * holds them at the shape both actually implement.
 */
type DetailLoad = (event: unknown) => Promise<Record<string, { slug: string }>>;

/** The load event both loaders read: a `fetch` they pass through, and the slug. */
const EVENT = { fetch: vi.fn(), params: { handle: "bde" } };

/** Runs a loader and returns the HttpError SvelteKit would have thrown to the renderer. */
async function statusOf(load: DetailLoad, failure: unknown): Promise<{ status: number }> {
	mocked.mockRejectedValue(failure);
	try {
		await load(EVENT);
	} catch (e) {
		return { status: (e as { status: number }).status };
	}
	throw new Error("loader did not throw");
}

beforeEach(() => {
	mocked.mockReset();
});

describe.each([
	["association", loadAssociation as unknown as DetailLoad, "association"],
	["list", loadList as unknown as DetailLoad, "list"],
] as const)("%s detail loader", (_label, load, key) => {
	it("returns the entity when the API answers", async () => {
		mocked.mockResolvedValue({ slug: "bde", name: "BDE" } as never);
		const data = await load(EVENT);
		expect(data[key].slug).toBe("bde");
	});

	it("404s only when the API ANSWERED that the slug does not exist", async () => {
		const { status } = await statusOf(load, new CanariApiError(404, "https://x/bde"));
		expect(status).toBe(404);
	});

	it("503s when the API answered with a server error", async () => {
		const { status } = await statusOf(load, new CanariApiError(502, "https://x/bde"));
		expect(status).toBe(503);
	});

	it("503s when the API never answered at all", async () => {
		const { status } = await statusOf(load, new CanariApiError(null, "https://x/bde"));
		expect(status).toBe(503);
	});

	it("404s on a failure that is not an API failure - a broken payload is not a retry", async () => {
		const { status } = await statusOf(load, new TypeError("bad json"));
		expect(status).toBe(404);
	});
});
