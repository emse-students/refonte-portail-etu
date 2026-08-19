import type { RequestHandler } from "./$types";
import { getAssociations } from "$lib/canari";

/**
 * The site's link graph, stated for crawlers.
 *
 * **`robots.txt` has advertised this path since the portal shipped, and it answered 404** - measured
 * on prod 2026-08-19. A crawler following a `Sitemap:` line to a 404 does not fall back to guessing;
 * it has no way to reach `/associations/{slug}` at all, because that link exists only after
 * hydration. So until now the whole detail half of the site was uncrawlable by construction.
 *
 * Built per request rather than prerendered: a static list of five static routes tells a crawler
 * nothing about the content, and the associations change without a deploy.
 *
 * **Both halves are allowed to come back empty.** A short sitemap is worth serving; a 500 is not,
 * because a crawler treats a broken sitemap as a reason to stop asking. Archived entities are
 * skipped - they are still reachable by URL, they are simply not something to put in front of a
 * search engine on their own.
 */
export const prerender = false;

/** How long a crawler may reuse this. It changes only when Canari's directory does. */
const CACHE_SECONDS = 3600;

/** `&`, `<` and `>` are the three that break an XML document; the rest are legal as-is. */
function escapeXml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc: string, priority: string, changefreq: string): string {
	return `\t<url>\n\t\t<loc>${escapeXml(loc)}</loc>\n\t\t<changefreq>${changefreq}</changefreq>\n\t\t<priority>${priority}</priority>\n\t</url>`;
}

export const GET: RequestHandler = async ({ fetch, url }) => {
	const origin = url.origin;

	const [associations, lists] = await Promise.all([
		getAssociations(fetch, "association").catch(() => []),
		getAssociations(fetch, "list").catch(() => []),
	]);

	const entries = [
		urlEntry(`${origin}/`, "1.0", "weekly"),
		urlEntry(`${origin}/associations`, "0.9", "weekly"),
		urlEntry(`${origin}/lists`, "0.8", "weekly"),
		urlEntry(`${origin}/liens`, "0.5", "monthly"),
		...associations
			.filter((a) => !a.archived)
			.map((a) => urlEntry(`${origin}/associations/${a.slug}`, "0.7", "monthly")),
		...lists
			.filter((l) => !l.archived)
			.map((l) => urlEntry(`${origin}/lists/${l.slug}`, "0.6", "monthly")),
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

	return new Response(body, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": `public, max-age=${CACHE_SECONDS}`,
		},
	});
};
