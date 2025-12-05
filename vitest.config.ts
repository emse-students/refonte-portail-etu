import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";
import { PluginOption } from "vite";

const enhancedImgMockPlugin = (): PluginOption => ({
	name: "enhanced-img-mock",
	enforce: "pre",
	transform(code: string, id: string) {
		if (id.endsWith(".svelte")) {
			return {
				code: code.replace(/<enhanced:img/g, "<img"),
				map: null,
			};
		}
	},
});

export default defineConfig({
	plugins: [enhancedImgMockPlugin(), sveltekit()],
	test: {
		passWithNoTests: true,
		include: ["tests/**/*.{test,spec}.{js,ts}"],
		exclude: ["tests/e2e/**", "node_modules/**"],
		environment: "jsdom",
		setupFiles: ["tests/setup.ts"],
		css: false,
		reporters: process.env.CI ? ["github-actions"] : ["default"],
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
