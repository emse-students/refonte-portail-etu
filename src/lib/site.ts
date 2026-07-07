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
export const SITE_TAGLINE =
	"La vitrine ouverte de la vie associative de l'École des Mines de Saint-Étienne.";

/** Builds a page title of the form "Section - Portail Étudiant ICM". */
export function pageTitle(section?: string): string {
	return section ? `${section} - ${SITE_NAME}` : SITE_NAME;
}
