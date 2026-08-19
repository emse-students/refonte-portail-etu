import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, type Plugin } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

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
		// The strategy list is deliberately short. The site renders on the SERVER
		// and hydrates in the BROWSER, so the locale is resolved twice and the two
		// answers must agree by construction - Svelte claims the server's text
		// nodes on hydration rather than comparing them. Paraglide skips
		// `localStorage` and `preferredLanguage` whenever `isServer`, so either one
		// in this list means the server falls through to `baseLocale` while the
		// client answers something else, and the reader is stuck on French text
		// until their first client-side navigation. `cookie` is the only strategy
		// both sides can read; `LocaleToggle` writes it and reloads.
		// See src/hooks.server.ts.
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/lib/paraglide",
			strategy: ["cookie", "baseLocale"],
		}),
		sveltekit(),
		paraglideNodeBuiltinSpecifier(),
	],
});
