import { CANARI_URL } from "#lib/canari";
import type { CanariAssociation } from "#lib/types";

/**
 * Public URL of an association/list logo, or null when it has none.
 * Prefers the migrated media-service blob (logoMediaId) and falls back to a
 * stored logoUrl. Always publicly reachable - no authentication required.
 */
export function logoUrl(a: Pick<CanariAssociation, "logoMediaId" | "logoUrl">): string | null {
	if (a.logoMediaId) return `${CANARI_URL}/api/media/public/${a.logoMediaId}`;
	if (a.logoUrl) return a.logoUrl;
	return null;
}

/**
 * The URL a member photo is loaded from, or null when there is none to load - the caller then draws
 * initials and never issues the request.
 *
 * - **`avatarUrl` present** (Canari's address for the photo, keyed by the roster row): a path is
 *   resolved against {@link CANARI_URL}, so the visitor's browser fetches it from Canari directly;
 *   an absolute URL is accepted only on that same origin, so a payload cannot point an `<img>` at a
 *   host of its choosing. `null` means Canari has no public photo for this row (a carte card whose
 *   member left the association): initials, and NO fallback to the account id.
 * - **`avatarUrl` absent** (a Canari that predates the field): the legacy path, this showcase's own
 *   MiGallery proxy keyed by `userId`. TRANSITIONAL - it goes when Canari strips `userId`.
 */
export function memberPhotoUrl(person: {
	avatarUrl?: string | null;
	userId?: string | null;
}): string | null {
	const { avatarUrl, userId } = person;
	if (avatarUrl === undefined) {
		return userId ? `/api/users/${encodeURIComponent(userId)}/avatar` : null;
	}
	if (!avatarUrl) return null;
	if (avatarUrl.startsWith("/") && !avatarUrl.startsWith("//")) return `${CANARI_URL}${avatarUrl}`;
	try {
		const url = new URL(avatarUrl);
		if (url.origin === new URL(CANARI_URL).origin) return url.href;
	} catch {
		// Not a URL at all: refused below, like a foreign origin.
	}
	console.warn(`[MEMBER_PHOTO] refused an avatarUrl outside ${CANARI_URL}: ${avatarUrl}`);
	return null;
}

/** Up to two uppercase initials from a name, for avatar/logo placeholders. */
export function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministic pleasant HSL color derived from a string, used as a fallback
 * background when an association/list has no logo or a member has no avatar.
 */
export function generateColor(seed: string): string {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = seed.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 45%, 45%)`;
}
