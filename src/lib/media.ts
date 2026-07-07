import { CANARI_URL } from "$lib/canari";
import type { CanariAssociation } from "$lib/types";

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
 * Same-origin URL of a member's avatar, proxied by the portal from MiGallery
 * (see src/routes/api/users/[userId]/avatar). Returns 404 when the user has no
 * avatar, so consumers render an initials fallback on the image `onerror`.
 */
export function avatarUrl(userId: string): string {
	return `/api/users/${encodeURIComponent(userId)}/avatar`;
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
