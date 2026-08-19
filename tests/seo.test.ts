import { describe, it, expect } from "vitest";
import {
	INSTITUTION_ID,
	breadcrumbNode,
	canonicalUrl,
	defaultImage,
	fullTitle,
	institutionNode,
	itemListNode,
	organizationNode,
	prune,
	serializeJsonLd,
	siteNode,
} from "$lib/seo";

/**
 * What a crawler and a link unfurler are handed is the product of this site, so the properties worth
 * pinning are the ones that fail SILENTLY: a relative `og:image` no unfurler can resolve, a JSON-LD
 * graph a validator rejects for a declared-but-empty property, and - the only one with teeth - an
 * association name typed by a human that closes the `<script>` element it is embedded in.
 *
 * None of these break a page render, so none of them would surface in a smoke test. They surface as
 * a preview card that never appears and a rich result that never shows up, weeks later.
 */

describe("absolute URLs", () => {
	it("builds the preview image and the canonical from the request origin", () => {
		expect(defaultImage("https://portail-etu.emse.fr")).toBe(
			"https://portail-etu.emse.fr/logo.png"
		);
		expect(canonicalUrl("http://localhost:5173", "/associations/bde")).toBe(
			"http://localhost:5173/associations/bde"
		);
	});

	it("drops query and hash - the same content under a filter is not a second page", () => {
		expect(canonicalUrl("https://portail-etu.emse.fr", "/associations")).toBe(
			"https://portail-etu.emse.fr/associations"
		);
	});
});

describe("fullTitle", () => {
	it("suffixes a section, and leaves the home page as the bare site name", () => {
		expect(fullTitle({ section: "Associations", description: "x" })).toBe(
			"Associations - Portail Étudiant ICM"
		);
		expect(fullTitle({ description: "x" })).toBe("Portail Étudiant ICM");
	});
});

describe("serializeJsonLd", () => {
	it("wraps the nodes in a schema.org graph", () => {
		const parsed = JSON.parse(serializeJsonLd([{ "@type": "WebSite" }]));
		expect(parsed["@context"]).toBe("https://schema.org");
		expect(parsed["@graph"]).toEqual([{ "@type": "WebSite" }]);
	});

	it("cannot close the script element it is embedded in", () => {
		const hostile = serializeJsonLd([{ name: "</script><img src=x onerror=alert(1)>" }]);
		expect(hostile).not.toContain("</script>");
		expect(hostile).not.toContain("<");
		// Still the same document to a JSON parser - the escape is at the JSON level, not a mangling.
		expect(JSON.parse(hostile)["@graph"][0].name).toBe("</script><img src=x onerror=alert(1)>");
	});

	it("escapes ampersands too, so an HTML entity in a name survives verbatim", () => {
		const out = serializeJsonLd([{ name: "Arts &amp; Metiers" }]);
		expect(out).not.toContain("&");
		expect(JSON.parse(out)["@graph"][0].name).toBe("Arts &amp; Metiers");
	});
});

describe("prune", () => {
	it("removes undefined, null and empty members and keeps falsy-but-real ones", () => {
		expect(prune({ a: "x", b: null, c: undefined, d: "", e: 0, f: false })).toEqual({
			a: "x",
			e: 0,
			f: false,
		});
	});
});

describe("graph nodes", () => {
	it("hangs the site and every association off one institution @id", () => {
		expect(institutionNode()["@id"]).toBe(INSTITUTION_ID);
		expect(siteNode("https://portail-etu.emse.fr").publisher).toEqual({ "@id": INSTITUTION_ID });
		const org = organizationNode({
			origin: "https://portail-etu.emse.fr",
			path: "/associations/bde",
			name: "BDE",
			description: null,
			logo: null,
			email: null,
		});
		expect(org.memberOf).toEqual({ "@id": INSTITUTION_ID });
	});

	it("omits an association's absent description, logo and email rather than declaring them empty", () => {
		const org = organizationNode({
			origin: "https://portail-etu.emse.fr",
			path: "/associations/bde",
			name: "BDE",
			description: null,
			logo: null,
			email: null,
		});
		expect(Object.keys(org)).toEqual(["@type", "@id", "name", "url", "memberOf"]);
	});

	it("numbers a breadcrumb from 1 and makes every item absolute", () => {
		const crumb = breadcrumbNode("https://portail-etu.emse.fr", [
			{ name: "Accueil", path: "/" },
			{ name: "Associations", path: "/associations" },
		]);
		expect(crumb.itemListElement).toEqual([
			{
				"@type": "ListItem",
				position: 1,
				name: "Accueil",
				item: "https://portail-etu.emse.fr/",
			},
			{
				"@type": "ListItem",
				position: 2,
				name: "Associations",
				item: "https://portail-etu.emse.fr/associations",
			},
		]);
	});

	it("states a directory's length alongside its items", () => {
		const list = itemListNode("https://portail-etu.emse.fr", "Associations", [
			{ name: "BDE", path: "/associations/bde" },
		]);
		expect(list.numberOfItems).toBe(1);
		expect(list.itemListElement).toEqual([
			{
				"@type": "ListItem",
				position: 1,
				name: "BDE",
				url: "https://portail-etu.emse.fr/associations/bde",
			},
		]);
	});
});
