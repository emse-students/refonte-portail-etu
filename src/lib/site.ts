/**
 * Brand identity of the showcase, kept in one place so the name never diverges
 * across the header, footer, and page titles. Routed through i18n later; for now
 * these are the canonical French-facing strings.
 */

/** Full brand name, used in the header and as the page-title suffix. */
export const SITE_NAME = "Portail Étudiant ICM";

/** Short brand name, used where space is tight (mobile, dense footers). */
export const SITE_SHORT = "Portail-etu";

/** One-line description of what the showcase is. */
export const SITE_TAGLINE = "La vie associative de l'École des Mines de Saint-Étienne.";

/**
 * The home page's title. It names the school because the brand alone ranks for nothing anyone
 * types: "Portail Étudiant ICM" is not a query, "associations Mines Saint-Étienne" is (SEO audit,
 * 2026-09-27). Inner pages keep the short suffix - their own name already says what they are, and a
 * search result cuts a title at ~60 characters.
 */
export const HOME_TITLE = `${SITE_NAME} - Mines Saint-Étienne`;

/** Builds a page title of the form "Section - Portail Étudiant ICM", or {@link HOME_TITLE}. */
export function pageTitle(section?: string): string {
	return section ? `${section} - ${SITE_NAME}` : HOME_TITLE;
}
