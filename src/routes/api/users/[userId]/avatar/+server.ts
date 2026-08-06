import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { AvatarCache, isCacheableAbsence, type AvatarAnswer } from "$lib/server/avatarCache";

/** MiGallery base URL; the avatar endpoint lives at `${base}/users/:id/avatar`. */
const GALLERY_API_URL = (env.GALLERY_API_URL || "https://gallery.mitv.fr/api").replace(/\/+$/, "");

/**
 * Shared by every request: pm2 runs a single fork, so one process serves all
 * visitors and one cache spares them all. Sized for a large roster - 500 avatars
 * of ~10 KB is a few megabytes, against a process that idles at ~84 MB.
 */
const cache = new AvatarCache({
	imageTtlMs: 60 * 60 * 1000,
	absentTtlMs: 10 * 60 * 1000,
	maxEntries: 500,
});

/**
 * Build the client response for a cached-or-fresh answer. `X-Cache` is exposed so
 * the cache can be verified from outside with one request, without reading a log
 * on a host that has no SSH access.
 */
const respond = (answer: AvatarAnswer, cacheState: "hit" | "miss"): Response => {
	if (answer.kind === "absent") {
		// A real absence is an answer and may be cached; the UI renders initials.
		return new Response(null, {
			status: 404,
			headers: { "Cache-Control": "public, max-age=600", "X-Cache": cacheState },
		});
	}
	return new Response(answer.body, {
		headers: {
			"Content-Type": "image/jpeg",
			"Cache-Control": "public, max-age=86400",
			"X-Cache": cacheState,
		},
	});
};

/**
 * Same-origin avatar proxy for the showcase. The browser requests
 * `/api/users/:userId/avatar`; this server route fetches the image from
 * MiGallery with the portal's dedicated API key (kept server-side) and streams
 * it back. Mirrors how Canari and Sky serve avatars. Returns 404 on any miss so
 * the client renders its initials fallback (see MemberCard).
 *
 * `userId` is the Authentik uid carried by the Canari public API, which is the
 * same identifier MiGallery keys avatars by.
 *
 * Answers are cached in process (see avatarCache): without it a page of N members
 * opened N connections to MiGallery on every visit, which is what turned a single
 * burst of outbound connection failures into 479 HTTP 502s. A transport failure is
 * never cached and never disguised as a 404 - it is a 502 marked `no-store`,
 * because "I could not reach the upstream" is not an answer about the avatar.
 */
export const GET = async (event: RequestEvent): Promise<Response> => {
	const userId = event.params.userId;

	// Prevent SSRF / path traversal: only safe identifier characters.
	if (!userId || !/^[a-zA-Z0-9_-]{1,128}$/.test(userId)) {
		return new Response(null, { status: 400 });
	}

	if (!env.GALLERY_API_KEY) {
		console.error("GALLERY_API_KEY is not set - avatar proxy disabled");
		return new Response(null, { status: 503 });
	}

	const cached = cache.get(userId);
	if (cached) return respond(cached, "hit");

	try {
		const res = await event.fetch(`${GALLERY_API_URL}/users/${userId}/avatar`, {
			method: "GET",
			headers: {
				Accept: "image/jpeg",
				"x-api-key": env.GALLERY_API_KEY,
				Origin: env.PORTAL_URL ?? "",
			},
		});

		if (!res.ok) {
			console.error(`Avatar fetch failed for ${userId}: ${res.status}`);
			if (isCacheableAbsence(res.status)) {
				const answer: AvatarAnswer = { kind: "absent" };
				cache.set(userId, answer);
				return respond(answer, "miss");
			}
			// Not an answer about this avatar (rotated key, MiGallery 5xx, rate limit):
			// the client still degrades to initials, but nothing is stored and nothing
			// is cached downstream, so recovery is immediate.
			return new Response(null, {
				status: 404,
				headers: { "Cache-Control": "no-store", "X-Cache": "miss" },
			});
		}

		const answer: AvatarAnswer = { kind: "image", body: await res.arrayBuffer() };
		cache.set(userId, answer);
		return respond(answer, "miss");
	} catch (err) {
		// Transport failure: the upstream said nothing, so nothing is cached and the
		// next request tries again. Logging the error keeps the only telemetry this
		// host exposes - it is what identified the 2026-08-06 outage as an outbound
		// connection failure rather than a DNS, TLS or configuration fault.
		console.error(`Avatar proxy error for ${userId}:`, err);
		return new Response(null, {
			status: 502,
			headers: { "Cache-Control": "no-store", "X-Cache": "miss" },
		});
	}
};
