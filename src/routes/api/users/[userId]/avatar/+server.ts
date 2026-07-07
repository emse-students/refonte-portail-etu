import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

/** MiGallery base URL; the avatar endpoint lives at `${base}/users/:id/avatar`. */
const GALLERY_API_URL = (env.GALLERY_API_URL || "https://gallery.mitv.fr/api").replace(/\/+$/, "");

/**
 * Same-origin avatar proxy for the showcase. The browser requests
 * `/api/users/:userId/avatar`; this server route fetches the image from
 * MiGallery with the portal's dedicated API key (kept server-side) and streams
 * it back. Mirrors how Canari and Sky serve avatars. Returns 404 on any miss so
 * the client renders its initials fallback (see MemberCard).
 *
 * `userId` is the Authentik uid carried by the Canari public API, which is the
 * same identifier MiGallery keys avatars by.
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
			return new Response(null, { status: 404 });
		}

		const body = await res.arrayBuffer();
		return new Response(body, {
			headers: {
				"Content-Type": "image/jpeg",
				"Cache-Control": "public, max-age=86400",
			},
		});
	} catch (err) {
		console.error(`Avatar proxy error for ${userId}:`, err);
		return new Response(null, { status: 502 });
	}
};
