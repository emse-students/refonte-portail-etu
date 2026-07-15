import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
	plugins: [
		// Compile Paraglide before SvelteKit so the generated runtime in
		// src/lib/paraglide exists. SPA mode (ssr=false): locale detection is
		// client-side via localStorage, then the browser's preferred language,
		// falling back to the base locale (fr).
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/lib/paraglide",
			strategy: ["localStorage", "preferredLanguage", "baseLocale"],
		}),
		sveltekit(),
	],
});
