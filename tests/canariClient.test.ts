import { describe, it, expect, vi } from "vitest";
import { CanariApiError, getAssociationBySlug, getAssociations } from "#lib/canari";

/**
 * EVERY FAILURE OF A READ LEAVES THE CLIENT AS A `CanariApiError`. The detail loaders answer 404
 * only for an error whose `status` is 404 and 503 for any other `CanariApiError`; so a failure that
 * left as anything else would be read as "this page does not exist".
 */

/** The error a read of "bde" fails with, when the network answers `response`. */
async function failureOf(response: () => Promise<Response>): Promise<unknown> {
	try {
		await getAssociationBySlug(response as unknown as typeof fetch, "bde");
	} catch (e) {
		return e;
	}
	throw new Error("the read did not fail");
}

describe("the Canari client classifies what it could not read", () => {
	it("a success whose body is not JSON is an answer nobody can use, not an absence", async () => {
		const failure = await failureOf(async () => new Response("<html>maintenance</html>"));

		expect(failure).toBeInstanceOf(CanariApiError);
		expect((failure as CanariApiError).status).toBeNull();
		expect((failure as CanariApiError).isAbsent).toBe(false);
		expect((failure as CanariApiError).cause).toBeInstanceOf(SyntaxError);
	});

	it("a body that stops arriving is classified the same way", async () => {
		const cut = new ReadableStream({
			start(controller) {
				controller.enqueue(new TextEncoder().encode('{"slug":'));
				controller.error(new DOMException("The operation timed out.", "TimeoutError"));
			},
		});
		const failure = await failureOf(async () => new Response(cut));

		expect(failure).toBeInstanceOf(CanariApiError);
		expect((failure as CanariApiError).status).toBeNull();
	});

	it("a 404 is still the API saying the slug does not exist", async () => {
		const failure = await failureOf(async () => new Response("{}", { status: 404 }));

		expect((failure as CanariApiError).isAbsent).toBe(true);
	});

	it("a readable success is returned", async () => {
		const read = await getAssociationBySlug(
			(async () => Response.json({ slug: "bde" })) as unknown as typeof fetch,
			"bde"
		);

		expect(read.slug).toBe("bde");
	});
});

/**
 * THE DIRECTORY IS READ FOR THIS SHOWCASE'S SPACE (2026-11-14). Only the carte named the space, so
 * the portal of ICM Saint-Etienne listed another campus's associations and served their pages.
 */
describe("the Canari client names the showcase's space on every directory read", () => {
	/** The URLs a read asks for. */
	async function urlsOf(read: (fetch: typeof globalThis.fetch) => Promise<unknown>) {
		const urls: string[] = [];
		await read((async (url: string) => {
			urls.push(url);
			return Response.json([]);
		}) as unknown as typeof fetch);
		return urls;
	}

	it("the list carries the space, beside the type", async () => {
		const [url] = await urlsOf((fetch) => getAssociations(fetch, "list"));
		const query = new URL(url).searchParams;
		expect(query.get("type")).toBe("list");
		expect(query.get("space")).toBe("ICM:saint-etienne");
	});

	it("a page by slug carries the space, so another space's entity is Canari's 404", async () => {
		const [url] = await urlsOf((fetch) => getAssociationBySlug(fetch, "minitel"));
		expect(new URL(url).pathname.endsWith("/associations/slug/minitel")).toBe(true);
		expect(new URL(url).searchParams.get("space")).toBe("ICM:saint-etienne");
	});

	it("with no space configured the read is complete, and says so", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		try {
			const [url] = await urlsOf((fetch) => getAssociations(fetch, "association", null));
			expect(new URL(url).searchParams.has("space")).toBe(false);
			expect(warn).toHaveBeenCalledWith(expect.stringContaining("PUBLIC_CANARI_CARTE_SPACE"));
		} finally {
			warn.mockRestore();
		}
	});
});
