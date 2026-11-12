import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The content security policy, read by `vite.config.ts` (SvelteKit's `csp` option, which adds a
 * hash for each inline script it writes) and by the tests.
 *
 * TWO STAGES. `directives` is ENFORCED now. `reportOnly` is OBSERVED for one release: nothing in
 * it blocks anything, and every violation a browser sees is posted to `CSP_REPORT_PATH` and logged
 * (`noteCspReport`). Once the log of a release is quiet, its entries move to `directives`.
 *
 * The origins below are the ones the pages load from, read from the same variables the code reads.
 * This module runs at BUILD time, where the deploy's `.env` is absent, so a variable unset here
 * gives the default the code itself falls back to (`src/lib/canari.ts`); a deployment that points
 * `PUBLIC_CANARI_URL` elsewhere at run time shows up as report lines naming that origin.
 */

/** Where a browser posts what the report-only policy would have blocked. */
export const CSP_REPORT_PATH = "/api/csp-report";

/** The Canari origin: the same variable and the same default as `CANARI_URL` in `src/lib/canari.ts`. */
export const CANARI_ORIGIN = new URL(
	(process.env.PUBLIC_CANARI_URL || "https://canari.emse.fr").replace(/\/$/, "")
).origin;

/**
 * The `sha256-` source of the inline script in `src/app.html` (the theme class, set before the
 * first paint). SvelteKit hashes the scripts it writes itself, not the ones in the template.
 */
export function inlineScriptHash(html: string): string {
	const match = /<script>([\s\S]*?)<\/script>/.exec(html);
	if (!match) throw new Error("csp.config: no inline <script> found in src/app.html");
	return `sha256-${createHash("sha256").update(match[1]).digest("base64")}`;
}

const THEME_SCRIPT_HASH = inlineScriptHash(
	readFileSync(resolve(process.cwd(), "src/app.html"), "utf8")
);

export const CSP = {
	mode: "auto",
	directives: {
		// No other site may display this one in a frame (the modern form of X-Frame-Options). No
		// page of the ecosystem embeds the portal: it links out to the other sites and is framed by
		// none of them.
		"frame-ancestors": ["self"],
	},
	reportOnly: {
		"default-src": ["self"],
		// Svelte's own inline scripts are hashed by SvelteKit; the theme script of `app.html` is
		// named here.
		"script-src": ["self", THEME_SCRIPT_HASH],
		// Svelte and the carte write `style` attributes (positions, colours, scale): inline styles
		// stay. Fonts and the stylesheet are bundled and served from this origin.
		"style-src": ["self", "unsafe-inline"],
		// Canari: association and list logos (`/api/media/public/<id>`, see `logoUrl`). `data:`: the
		// carte's background image arrives as a data URL, and small bundled assets may be inlined.
		// Member faces are same-origin (`/api/users/<id>/avatar`, proxied from MiGallery by the
		// server), so no gallery origin is listed.
		"img-src": ["self", "data:", CANARI_ORIGIN],
		// Fonts are `@fontsource` packages, bundled and served from this origin; small ones inline.
		"font-src": ["self", "data:"],
		// Canari: the public API (`/api/public/*`), which a client-side navigation reads straight
		// from the visitor's browser.
		"connect-src": ["self", CANARI_ORIGIN],
		"object-src": ["none"],
		"base-uri": ["self"],
		// The site has no form that posts elsewhere; the language and theme toggles act locally.
		"form-action": ["self"],
		"report-uri": [CSP_REPORT_PATH],
	},
} as const;
