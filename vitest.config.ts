import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		passWithNoTests: true,
		include: ["tests/**/*.{test,spec}.{js,ts}"],
		exclude: ["tests/e2e/**", "node_modules/**"],
		environment: "jsdom",
		setupFiles: ["tests/setup.ts"],
		css: false,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.{js,ts,svelte}"],
			exclude: ["src/app.d.ts", "src/lib/databasetypes.d.ts"],
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
