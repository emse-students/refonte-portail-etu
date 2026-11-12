import { describe, it, expect } from "vitest";
import { CanariApiError, getAssociationBySlug } from "#lib/canari";

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
