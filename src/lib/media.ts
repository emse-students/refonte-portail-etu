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
 * Canari serves the photo itself and hands out its address as `avatarUrl` on every public roster
 * member and carte card: a path on the Canari origin, keyed by the roster row rather than by the
 * person's account. A path is resolved against {@link CANARI_URL}; an absolute URL is accepted
 * only on that same origin, so a payload cannot point an `<img>` at a host of its choosing.
 * Anything else is refused, and said so, because it means Canari and this showcase disagree on the
 * contract.
 */
export function memberPhotoUrl(avatarUrl: string | null | undefined): string | null {
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
