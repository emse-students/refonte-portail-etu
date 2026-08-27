/**
 * In-process cache for the member avatars proxied from MiGallery.
 *
 * Why it exists: the portal cached nothing, so one association page with N
 * members opened N connections to MiGallery per visitor, on every single visit.
 * When the host briefly could not open an outbound connection (2026-08-06), that
 * amplification turned one network fault into 479 recorded HTTP 502s - one per
 * card, in tight bursts.
 *
 * What it deliberately does NOT store: failures. A transport error is not an
 * answer about the avatar, so it stays a 502 and is re-attempted on the next
 * request; caching it would make a passing outage stick for a whole TTL. Only the
 * two real answers are stored - the image itself, and the upstream's "this user
 * has none".
 *
 * The clock is injected because a test must never assert a wall clock, and the
 * entry count is capped because this process is long-lived (a pm2 fork whose
 * uptime is measured in days) and a roster of unknown size must not grow it
 * without bound.
 */

/** The two answers the upstream can actually give about an avatar. */
export type AvatarAnswer =
	| { readonly kind: "image"; readonly body: ArrayBuffer }
	| { readonly kind: "absent" };

/**
 * Whether a non-ok upstream status means "this user has no avatar" - the only
 * negative that may be cached.
 *
 * A 404 is an answer about the avatar. A 401 on a rotated key, a 429, or a 5xx
 * from MiGallery are answers about MiGallery, and storing them as an absence
 * would turn one upstream fault into ten minutes of missing faces across the
 * whole site. Same rule as the route's 502: only answers are cached.
 */
export const isCacheableAbsence = (status: number): boolean => status === 404;

export interface AvatarCacheOptions {
	/** How long a fetched image stays fresh. */
	readonly imageTtlMs: number;
	/** How long an "upstream has none" stays fresh. Shorter: a user may add one. */
	readonly absentTtlMs: number;
	/** Hard ceiling on stored entries; past it the oldest insertion is evicted. */
	readonly maxEntries: number;
	/** Injectable clock, so tests advance time instead of waiting for it. */
	readonly now?: () => number;
}

interface Slot {
	readonly answer: AvatarAnswer;
	readonly expiresAt: number;
}

export class AvatarCache {
	readonly #slots = new Map<string, Slot>();
	readonly #imageTtlMs: number;
	readonly #absentTtlMs: number;
	readonly #maxEntries: number;
	readonly #now: () => number;

	constructor(options: AvatarCacheOptions) {
		this.#imageTtlMs = options.imageTtlMs;
		this.#absentTtlMs = options.absentTtlMs;
		this.#maxEntries = options.maxEntries;
		this.#now = options.now ?? (() => Date.now());
	}

	/** Number of stored entries, expired ones included until they are read. */
	get size(): number {
		return this.#slots.size;
	}

	/**
	 * The cached answer for `userId`, or null when absent or stale. An expired
	 * slot is dropped on read, so a key that stops being requested cannot pin
	 * its payload in memory forever.
	 */
	get(userId: string): AvatarAnswer | null {
		const slot = this.#slots.get(userId);
		if (!slot) return null;
		if (slot.expiresAt <= this.#now()) {
			this.#slots.delete(userId);
			return null;
		}
		return slot.answer;
	}

	/**
	 * Store an answer, refreshing its position so eviction removes the
	 * least-recently-written key rather than the least-recently-read one.
	 */
	set(userId: string, answer: AvatarAnswer): void {
		const ttl = answer.kind === "image" ? this.#imageTtlMs : this.#absentTtlMs;
		this.#slots.delete(userId);
		this.#slots.set(userId, { answer, expiresAt: this.#now() + ttl });
		while (this.#slots.size > this.#maxEntries) {
			// Map iterates in insertion order, so the first key is the oldest write.
			const oldest = this.#slots.keys().next();
			if (oldest.done) break;
			this.#slots.delete(oldest.value);
		}
	}

	/** Drop everything. Exists for tests; nothing in the app calls it. */
	clear(): void {
		this.#slots.clear();
	}
}
