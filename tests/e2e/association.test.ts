import { expect, test } from "@playwright/test";

test("association page loads", async ({ page }) => {
	await page.goto("/associations/bde");
	await expect(page.locator("h1")).toHaveText("Bureau des Élèves");
});

test("association page loads with different handle", async ({ page }) => {
	await page.goto("/associations/other");
	await expect(page.locator("h1")).toHaveText("Bureau des Élèves");
});
