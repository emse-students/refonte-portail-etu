import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

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
	],
});
