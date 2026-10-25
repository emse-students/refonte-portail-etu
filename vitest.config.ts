import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
	plugins: [sveltekit({ preprocess: vitePreprocess() })],
	test: {
		passWithNoTests: true,
		include: ["tests/**/*.{test,spec}.{js,ts}"],
		exclude: ["tests/e2e/**", "node_modules/**"],
		environment: "jsdom",
		setupFiles: ["tests/setup.ts"],
		css: false,
		reporters: process.env.CI ? ["default", "github-actions"] : ["default"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.{js,ts,svelte}"],
			exclude: ["src/app.d.ts"],
		},
		server: {
			deps: {
				inline: ["@sveltejs/kit"],
			},
		},
	},
	resolve: {
		conditions: ["browser"],
	},
});
