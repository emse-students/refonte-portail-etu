/**
 * Which pages may be indexed, decided by one rule: **a page that prints people's names is not put
 * in a search engine** (GDPR, see docs/wiki/data-protection.md). Members' first names, last names,
 * promos and photos are shown for visitors of the showcase, not for a name search to resurface
 * years after a mandate ended. Association pages with no member to show stay indexable.
 *
 * The rule is stated twice on purpose and both halves read this module: `<meta name="robots">`
 * (via `SeoMeta.noindex`) for engines that read the markup, and `X-Robots-Tag` for everything that
 * stops at the headers - an unfurler, a feed reader, a crawler that never parses the body.
 */

/** The directive both halves emit. `follow` stays on: the links out of these pages are harmless. */
export const NOINDEX = "noindex";

/** True when a page built from this entity prints at least one member. */
export function listsPeople(entity: { members?: readonly unknown[] | null }): boolean {
	return (entity.members?.length ?? 0) > 0;
}

/**
 * Sitemap eligibility of an association or list from the DIRECTORY payload, which carries only a
 * count: any member at all keeps the page out. The count can exceed what the detail page shows, so
 * this errs on the side of leaving a page out, never of advertising one that prints names.
 */
export function sitemapEligible(entry: { memberCount?: number | null }): boolean {
	return (entry.memberCount ?? 0) === 0;
}

/**
 * Paths whose responses are never an indexable document: the avatar proxy serves a person's face.
 * robots.txt already disallows `/api/`, but a disallow stops crawling, not indexing by reference.
 */
export function isApiPath(pathname: string): boolean {
	return pathname === "/api" || pathname.startsWith("/api/");
}
