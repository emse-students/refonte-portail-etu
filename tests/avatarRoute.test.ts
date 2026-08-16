import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { RequestEvent } from "@sveltejs/kit";

/**
 * The route around the cache. `avatarCache.test.ts` pins what may be STORED; this pins what is
 * ANSWERED, which is the half a visitor sees.
 *
 * Three conditions arrive at this route and only one of them is about the member: "no photo" is a
 * fact, while a refused key, a MiGallery 5xx and a MiGallery that says nothing at all are facts
 * about MiGallery. The route used to answer 404 to all four and log the first three - so a faceless
 * roster and a rotated key produced the same page, and every ordinary faceless card produced an
 * `error` line. What separates them now is the status (404 vs 502) and the log, never the cache:
 * only the first is remembered.
 *
 * The budget is asserted as "a signal was passed" rather than by advancing a clock: the deadline is
 * enforced inside `fetch`, which is mocked here, so the only thing this layer can honestly claim is
 * that it asked for one. A test must never assert a wall clock.
 */

vi.mock("$env/dynamic/private", () => ({
	env: { GALLERY_API_KEY: "test-key", GALLERY_API_URL: "https://gallery.example/api" },
}));

const { GET } = await import("../src/routes/api/users/[userId]/avatar/+server");

/** Only the two fields the route reads, shaped as SvelteKit passes them. */
const eventFor = (userId: string, fetch: ReturnType<typeof vi.fn>) =>
	({ params: { userId }, fetch }) as unknown as RequestEvent;

/** A distinct id per case: the route's cache is module-level and outlives a single test. */
let seq = 0;
const freshId = () => `user${++seq}`;

describe("the avatar proxy answers", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("gives MiGallery a stated deadline instead of waiting forever", async () => {
		const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
		await GET(eventFor(freshId(), fetch));

		expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
	});

	it("caches the upstream's 404 and says nothing about it", async () => {
		const id = freshId();
		const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));

		const first = await GET(eventFor(id, fetch));
		expect(first.status).toBe(404);
		expect(first.headers.get("X-Cache")).toBe("miss");
		// A member with no photo is the commonest case on the roster, not an incident.
		expect(console.error).not.toHaveBeenCalled();

		const second = await GET(eventFor(id, fetch));
		expect(second.headers.get("X-Cache")).toBe("hit");
		expect(fetch.mock.calls).toHaveLength(1);
	});

	it("answers 502 on a refused key, accuses, and does NOT remember it", async () => {
		const id = freshId();
		const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));

		const first = await GET(eventFor(id, fetch));
		expect(first.status).toBe(502);
		expect(first.headers.get("Cache-Control")).toBe("no-store");
		expect(String((console.error as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain("403");

		// The load-bearing assertion: the same id asked again reaches MiGallery again, so recovery
		// is immediate once the key is fixed rather than ten minutes away.
		await GET(eventFor(id, fetch));
		expect(fetch.mock.calls).toHaveLength(2);
	});

	it("answers 502 when the upstream says nothing at all", async () => {
		const id = freshId();
		const timedOut = new Error("The operation was aborted due to timeout");
		timedOut.name = "TimeoutError";
		const fetch = vi.fn().mockRejectedValue(timedOut);

		const response = await GET(eventFor(id, fetch));
		expect(response.status).toBe(502);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
		expect(console.error).toHaveBeenCalled();

		await GET(eventFor(id, fetch));
		expect(fetch.mock.calls).toHaveLength(2);
	});

	it("serves and caches a real image", async () => {
		const id = freshId();
		const fetch = vi
			.fn()
			.mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));

		const first = await GET(eventFor(id, fetch));
		expect(first.status).toBe(200);
		expect(first.headers.get("Content-Type")).toBe("image/jpeg");

		const second = await GET(eventFor(id, fetch));
		expect(second.headers.get("X-Cache")).toBe("hit");
		expect(fetch.mock.calls).toHaveLength(1);
	});

	it("refuses an id that is not an identifier, before reaching the network", async () => {
		const fetch = vi.fn();
		const response = await GET(eventFor("../../etc/passwd", fetch));

		expect(response.status).toBe(400);
		expect(fetch.mock.calls).toHaveLength(0);
	});
});
