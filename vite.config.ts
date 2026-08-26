import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, type Plugin } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";

/**
 * Rewrites Paraglide's `import("async_hooks")` to `import("node:async_hooks")`.
 *
 * `paraglideMiddleware` loads AsyncLocalStorage through the BARE specifier, which nothing in the
 * build can resolve, so `svelte-adapter-bun`'s bundling pass printed UNRESOLVED_IMPORT on every
 * build: "Could not resolve 'async_hooks' ... treating it as an external dependency". It was right -
 * Bun provides the module at runtime and the build worked - but a warning nobody can act on is a
 * line its reader learns to skip, and the next one will be real. The adapter externalises anything
 * matching `/^node:/`, so naming the builtin properly is the whole fix.
 *
 * If a future Paraglide emits the prefixed form itself, this no-ops and can be deleted. If it emits
 * something else again, the warning comes back and says so.
 */
function paraglideNodeBuiltinSpecifier(): Plugin {
	return {
		name: "paraglide-node-builtin-specifier",
		enforce: "post",
		transform(code, id) {
			if (!id.includes("paraglide/server.js")) return null;
			if (!code.includes('import("async_hooks")')) return null;
			return { code: code.replace('import("async_hooks")', 'import("node:async_hooks")') };
		},
	};
}

export default defineConfig({
	plugins: [
		// Compile Paraglide before SvelteKit so the generated runtime in
		// src/lib/paraglide exists.
		//
		// The site renders on the SERVER and hydrates in the BROWSER, so the locale
		// is resolved twice and the two answers must agree by construction -
		// Svelte claims the server's text nodes on hydration rather than comparing
		// them.
		//
		// `preferredLanguage` looks like it cannot satisfy that, because
		// `getLocale()` skips it whenever `isServer`. What makes it work is
		// `paraglideMiddleware` in src/hooks.server.ts: it resolves the locale from
		// the REQUEST - Accept-Language included - and runs the whole render inside
		// that binding, so `getLocale()` never reaches its own strategy list on the
		// server. The middleware is the load-bearing half; the list alone proves
		// nothing.
		//
		// Measured 2026-08-19, same Paraglide version, same middleware: an
		// `Accept-Language: en` request gets `<html lang="en">` and English text
		// from sky.mitv.fr and gallery.mitv.fr, which carry `preferredLanguage`.
		// This site, which had dropped it, answered `fr` to every visitor on earth.
		//
		// `localStorage` stays out: nothing on the server can read it.
		//
		// One consequence, latent today: the HTML now varies by Accept-Language and
		// the response carries no `Vary` header. Cloudflare reports `DYNAMIC` for it
		// - nothing caches it - so this costs nothing until somebody adds a cache
		// rule for HTML, at which point one visitor's language would be served to
		// the next.
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/lib/paraglide",
			strategy: ["cookie", "preferredLanguage", "baseLocale"],
		}),
		tailwindcss(),
		sveltekit(),
		paraglideNodeBuiltinSpecifier(),
	],
});
