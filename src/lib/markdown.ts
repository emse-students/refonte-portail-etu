/**
 * Markdown helpers for association/list bios served by the Canari public API.
 * Canari stores bios as Markdown (both the legacy `description` and the current
 * `bioMarkdown` fields) and renders them with `@humanspeak/svelte-markdown`;
 * the vitrine mirrors that so the two apps display identical text.
 */

/**
 * Single newlines in Markdown are normally collapsed; convert them to hard
 * breaks (two trailing spaces) so one Enter in Canari's bio editor renders as
 * one line break here too. Double newlines stay as paragraph separators.
 * Mirrors Canari's `normalizePostLineBreaks`.
 */
export function normalizeBioLineBreaks(md: string): string {
	const normalized = md.replace(/\r\n/g, "\n");
	return normalized.replace(/(?<!\n)\n(?!\n)/g, "  \n");
}
