import { describe, it, expect } from "vitest";
import { AvatarCache, isCacheableAbsence } from "$lib/server/avatarCache";

/**
 * The avatar cache exists because the portal had none: a page of N members opened
 * N connections to MiGallery per visitor, so one burst of outbound connection
 * failures on the host became 479 HTTP 502s (2026-08-06). What is worth pinning
 * down is not that a cache caches - it is the three rules that make it safe, each
 * invisible in the happy path:
 *
 * - a failure is never stored, so a passing outage cannot stick for a whole TTL
 *   (the route enforces this by not calling `set` in its catch; the type here
 *   makes the rule structural - there is no third answer kind to store);
 * - the two answers expire on their own schedules, an absence sooner than an
 *   image, because a user may upload one;
 * - the process is long-lived, so the entry count is capped.
 *
 * The clock is injected throughout: a test must never assert a wall clock.
 */

/** A stub image payload; only its identity matters to these assertions. */
const bytes = (byte: number): ArrayBuffer => new Uint8Array([byte]).buffer;

/** A cache wired to a clock the test controls, with the given TTLs and ceiling. */
const withClock = (options: { imageTtlMs?: number; absentTtlMs?: number; maxEntries?: number }) => {
	let clock = 1_000;
	const cache = new AvatarCache({
		imageTtlMs: options.imageTtlMs ?? 60_000,
		absentTtlMs: options.absentTtlMs ?? 10_000,
		maxEntries: options.maxEntries ?? 500,
		now: () => clock,
	});
	return { cache, advance: (ms: number) => (clock += ms) };
};

describe("AvatarCache", () => {
	it("returns null for a key it has never seen", () => {
		const { cache } = withClock({});
		expect(cache.get("nobody")).toBeNull();
	});

	it("serves a stored image back", () => {
		const { cache } = withClock({});
		cache.set("alice", { kind: "image", body: bytes(1) });
		expect(cache.get("alice")).toEqual({ kind: "image", body: bytes(1) });
	});

	it("distinguishes a stored absence from an unknown key, so the 404 is not re-fetched", () => {
		const { cache } = withClock({});
		cache.set("bob", { kind: "absent" });
		expect(cache.get("bob")).toEqual({ kind: "absent" });
		expect(cache.get("carol")).toBeNull();
	});

	it("expires an image only once its own TTL has passed", () => {
		const { cache, advance } = withClock({ imageTtlMs: 60_000 });
		cache.set("alice", { kind: "image", body: bytes(1) });

		advance(59_999);
		expect(cache.get("alice")).not.toBeNull();

		advance(1);
		expect(cache.get("alice")).toBeNull();
	});

	it("expires an absence sooner than an image, since a user may add one", () => {
		const { cache, advance } = withClock({ imageTtlMs: 60_000, absentTtlMs: 10_000 });
		cache.set("alice", { kind: "image", body: bytes(1) });
		cache.set("bob", { kind: "absent" });

		advance(10_000);
		expect(cache.get("bob")).toBeNull();
		expect(cache.get("alice")).not.toBeNull();
	});

	it("drops an expired entry on read rather than holding its payload", () => {
		const { cache, advance } = withClock({ imageTtlMs: 1_000 });
		cache.set("alice", { kind: "image", body: bytes(1) });
		expect(cache.size).toBe(1);

		advance(1_000);
		expect(cache.get("alice")).toBeNull();
		expect(cache.size).toBe(0);
	});

	it("caps the entry count, evicting the oldest write first", () => {
		const { cache } = withClock({ maxEntries: 2 });
		cache.set("first", { kind: "image", body: bytes(1) });
		cache.set("second", { kind: "image", body: bytes(2) });
		cache.set("third", { kind: "image", body: bytes(3) });

		expect(cache.size).toBe(2);
		expect(cache.get("first")).toBeNull();
		expect(cache.get("second")).not.toBeNull();
		expect(cache.get("third")).not.toBeNull();
	});

	it("re-writes refresh the eviction position, not just the expiry", () => {
		const { cache } = withClock({ maxEntries: 2 });
		cache.set("first", { kind: "image", body: bytes(1) });
		cache.set("second", { kind: "image", body: bytes(2) });
		cache.set("first", { kind: "image", body: bytes(9) });
		cache.set("third", { kind: "image", body: bytes(3) });

		// "second" is now the oldest write, so it goes - not "first".
		expect(cache.get("second")).toBeNull();
		expect(cache.get("first")).toEqual({ kind: "image", body: bytes(9) });
		expect(cache.get("third")).not.toBeNull();
	});
});

/**
 * The negative that may be stored is exactly one status. This is the rule that is
 * easiest to lose in a refactor - `!res.ok` reads like "no avatar" and is not -
 * and losing it is expensive: a rotated API key or one MiGallery 5xx would be
 * remembered as "these members have no face" for the whole absence TTL, across
 * every visitor.
 */
describe("isCacheableAbsence", () => {
	it("accepts a 404, the upstream's answer that the user has no avatar", () => {
		expect(isCacheableAbsence(404)).toBe(true);
	});

	it("rejects statuses that describe MiGallery rather than the avatar", () => {
		for (const status of [401, 403, 429, 500, 502, 503, 504]) {
			expect(isCacheableAbsence(status)).toBe(false);
		}
	});
});
