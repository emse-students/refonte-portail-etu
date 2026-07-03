/**
 * Association/list descriptions carry light legacy HTML (<b>, <br>, <a>, …) from
 * the former portal. This performs a minimal sanitization before the value is
 * rendered with {@html}: it strips <script>/<style> blocks, inline event
 * handlers and javascript: URLs. It is intentionally small - the content is
 * authored by association admins, not anonymous users - but blocks the obvious
 * injection vectors.
 */
export function sanitizeDescription(input: string | null | undefined): string {
	if (!input) return "";
	return input
		.replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, "")
		.replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
		.replace(/\son\w+\s*=\s*'[^']*'/gi, "")
		.replace(/javascript:/gi, "");
}
