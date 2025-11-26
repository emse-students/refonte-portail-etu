import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	webServer: {
		command: "bun run build && bun run preview:mock",
		port: 4173,
		reuseExistingServer: !process.env.CI,
	},
	testDir: "tests/e2e",
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
	],
	reporter: [["html", { open: "never" }]],
});
