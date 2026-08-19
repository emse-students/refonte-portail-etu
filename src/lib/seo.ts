import { SITE_NAME, SITE_TAGLINE, pageTitle } from "$lib/site";

/**
 * What a crawler and a link unfurler are given, and how it is built.
 *
 * This site is the PUBLIC face of the ecosystem - no login, no editing - so unlike everything else
 * in the stack its head is not a courtesy, it is the product. Two facts shape everything here:
 *
 * 1. **The head is only worth writing if the SERVER writes it.** An unfurler (Discord, Slack,
 *    WhatsApp) never runs the JavaScript, and Googlebot renders as an anonymous visitor. Under
 *    `ssr = false` `<svelte:head>` never ran on the server, so every page shipped a head with no
 *    title, no description and no image - measured on prod 2026-08-19, on `/associations/bde`.
 * 2. **Absolute URLs, from the REQUEST's own origin.** `og:image` and `og:url` are resolved by a
 *    machine that has no page context; a relative path is silently useless to every one of them.
 */

/** Everything one page contributes to its head. */
export interface SeoMeta {
	/** Section name; the site suffix is added by {@link pageTitle}. Omit on the home page. */
	section?: string;
	/** The sentence a search result and an unfurl card both show. */
	description: string;
	/** Absolute URL of the preview image, or null to fall back to the site logo. */
	image?: string | null;
	/** What the image shows, for a reader who cannot see it. */
	imageAlt?: string;
	/** `website` for a listing, `article` for one entity's page. */
	type?: "website" | "article";
	/** JSON-LD graph nodes for this page, if any. */
	jsonLd?: unknown[];
}

/** Absolute URL of the default preview image, from a request origin. */
export function defaultImage(origin: string): string {
	return `${origin}/logo.png`;
}

/** Absolute URL for a path, from a request origin. Query and hash are deliberately dropped. */
export function canonicalUrl(origin: string, pathname: string): string {
	return `${origin}${pathname}`;
}

/** The full title, so a caller never rebuilds the suffix. */
export function fullTitle(meta: SeoMeta): string {
	return pageTitle(meta.section);
}

/**
 * Serialises a JSON-LD graph for embedding in a `<script>` element.
 *
 * `JSON.stringify` leaves `</script>` byte-for-byte intact, and inside a script element that
 * sequence ENDS the element: everything after it parses as markup. Association names and member
 * names come from Canari and are typed by people, so this is an injection point, not a hypothetical
 * one. Escaping `<` and `&` as unicode escapes keeps the JSON identical to a parser and inert to
 * the HTML tokenizer.
 */
export function serializeJsonLd(nodes: unknown[]): string {
	return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes })
		.replace(/</g, "\\u003c")
		.replace(/&/g, "\\u0026");
}

/**
 * The complete script element carrying a page's JSON-LD graph.
 *
 * Built HERE rather than in the component on purpose: this is a plain `.ts` module, so the closing
 * tag is just nine characters. Assembled inside a `.svelte` file the same string has to carry an
 * escape to stop the Svelte parser ending the block early - noise that reads as a mistake, that the
 * linter flags as a useless escape, and that the next person is one cleanup away from deleting. The
 * escaping that actually matters is {@link serializeJsonLd}'s, and it is not optional.
 */
export function jsonLdScript(nodes: unknown[]): string {
	return `<script type="application/ld+json">${serializeJsonLd(nodes)}</script>`;
}

/** Drops undefined and null members: a declared-but-empty property is reported as malformed. */
export function prune<T extends Record<string, unknown>>(node: T): T {
	return Object.fromEntries(
		Object.entries(node).filter(([, v]) => v !== undefined && v !== null && v !== "")
	) as T;
}

/**
 * The school this showcase belongs to, as one node every graph points at.
 *
 * "Portail Etudiant ICM" is not a name anything can be won on. What makes the site identifiable is
 * being consistently attached to an institution a search engine already knows, by name, URL and
 * postal address - so this node hangs off the site and off every association.
 */
export const INSTITUTION_ID = "https://www.mines-stetienne.fr/#organization";

export function institutionNode(): Record<string, unknown> {
	return {
		"@type": "CollegeOrUniversity",
		"@id": INSTITUTION_ID,
		name: "Ecole des Mines de Saint-Etienne",
		alternateName: "Mines Saint-Etienne",
		url: "https://www.mines-stetienne.fr/",
		address: {
			"@type": "PostalAddress",
			streetAddress: "158 cours Fauriel",
			postalCode: "42023",
			addressLocality: "Saint-Etienne",
			addressCountry: "FR",
		},
	};
}

/** The site itself, referenced by `@id` from every page rather than repeated. */
export function siteNode(origin: string): Record<string, unknown> {
	return {
		"@type": "WebSite",
		"@id": `${origin}/#website`,
		name: SITE_NAME,
		description: SITE_TAGLINE,
		url: `${origin}/`,
		inLanguage: "fr",
		publisher: { "@id": INSTITUTION_ID },
	};
}

/**
 * One association or campaign list as an `Organization`.
 *
 * `memberOf` the school is what disambiguates a three-letter acronym: "BDE" alone means nothing to
 * a search engine, "BDE, member of Mines Saint-Etienne" is a thing it can place.
 */
export function organizationNode(input: {
	origin: string;
	path: string;
	name: string;
	description: string | null;
	logo: string | null;
	email: string | null;
}): Record<string, unknown> {
	return prune({
		"@type": "Organization",
		"@id": `${input.origin}${input.path}#organization`,
		name: input.name,
		description: input.description,
		url: `${input.origin}${input.path}`,
		logo: input.logo,
		email: input.email,
		memberOf: { "@id": INSTITUTION_ID },
	});
}

/** The trail a search result shows above its title. */
export function breadcrumbNode(
	origin: string,
	trail: { name: string; path: string }[]
): Record<string, unknown> {
	return {
		"@type": "BreadcrumbList",
		itemListElement: trail.map((step, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: step.name,
			item: `${origin}${step.path}`,
		})),
	};
}

/** A directory page as an ordered list of what it links to - the link graph, stated. */
export function itemListNode(
	origin: string,
	name: string,
	items: { name: string; path: string }[]
): Record<string, unknown> {
	return {
		"@type": "ItemList",
		name,
		numberOfItems: items.length,
		itemListElement: items.map((item, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: item.name,
			url: `${origin}${item.path}`,
		})),
	};
}
