import { describe, expect, it, vi } from "vitest";
import {
	CanariApiError,
	getAssociationBySlug,
	getAssociations,
	MissingSpaceError,
} from "#lib/canari";

/**
 * Owner, 2026-11-08: the portail shows only the associations of ITS space (the same set as its
 * carte, decided by Canari). The space travels on every association read, and a deployment that
 * names none gets a logged failure - never the unfiltered list.
 */
function recordingFetch(body: unknown = []) {
	const seen: string[] = [];
	const fetch = (async (input: RequestInfo | URL) => {
		seen.push(String(input));
		return { ok: true, status: 200, json: async () => body } as Response;
	}) as typeof globalThis.fetch;
	return { fetch, seen };
}

describe("the association reads name the space", () => {
	it("asks for the associations of the configured space", async () => {
		const { fetch, seen } = recordingFetch();
		await getAssociations(fetch, "association");
		expect(seen).toEqual([
			"https://canari.emse.fr/api/public/associations?type=association&space=ICM%3Asaint-etienne",
		]);
	});

	it("does not filter the promo lists by a space", async () => {
		const { fetch, seen } = recordingFetch();
		await getAssociations(fetch, "list");
		expect(seen).toEqual(["https://canari.emse.fr/api/public/associations?type=list"]);
	});

	it("asks for one association's page within the space, so another space's answers 404", async () => {
		const { fetch, seen } = recordingFetch({ slug: "bde" });
		await getAssociationBySlug(fetch, "bde");
		expect(seen).toEqual([
			"https://canari.emse.fr/api/public/associations/slug/bde?space=ICM%3Asaint-etienne",
		]);
	});

	it("refuses to read anything when no space is named, logged, as an unanswered API", async () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		const fetch = vi.fn() as unknown as typeof globalThis.fetch;
		const directory = await getAssociations(fetch, "association", null).catch((e: unknown) => e);
		expect(directory).toBeInstanceOf(MissingSpaceError);
		// A CanariApiError with no status: the loaders already answer it as "the API said nothing".
		expect(directory).toBeInstanceOf(CanariApiError);
		expect((directory as CanariApiError).status).toBeNull();
		await expect(getAssociationBySlug(fetch, "bde", null)).rejects.toBeInstanceOf(
			MissingSpaceError
		);
		expect(fetch).not.toHaveBeenCalled();
		expect(error).toHaveBeenCalledWith(expect.stringContaining("PUBLIC_CANARI_SPACE"));
		error.mockRestore();
	});
});
