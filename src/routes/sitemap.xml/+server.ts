import type { RequestHandler } from "@sveltejs/kit";
import db from "$lib/server/database";
import type { RawAssociation, RawList } from "$lib/databasetypes";

const site = "https://portail-etu.emse.fr";

export const GET: RequestHandler = async () => {
	// Fetch all associations and lists for dynamic URLs
	const associations = await db<RawAssociation>`SELECT handle FROM association ORDER BY id`;
	const lists = await db<RawList>`SELECT handle FROM list ORDER BY id`;

	const staticPages = [
		{ url: "/", priority: "1.0", changefreq: "daily" },
		{ url: "/associations", priority: "0.9", changefreq: "daily" },
		{ url: "/lists", priority: "0.9", changefreq: "daily" },
		{ url: "/autres-sites", priority: "0.7", changefreq: "weekly" },
		{ url: "/partenariats", priority: "0.7", changefreq: "weekly" },
	];

	const associationPages = associations.map((assoc) => ({
		url: `/associations/${assoc.handle}`,
		priority: "0.8",
		changefreq: "weekly",
	}));

	const listPages = lists.map((list) => ({
		url: `/lists/${list.handle}`,
		priority: "0.8",
		changefreq: "weekly",
	}));

	const allPages = [...staticPages, ...associationPages, ...listPages];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allPages
	.map(
		(page) => `  <url>
    <loc>${site}${page.url}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join("\n")}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "max-age=3600, s-maxage=3600",
		},
	});
};
