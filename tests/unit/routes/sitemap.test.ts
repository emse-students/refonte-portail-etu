import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../../../src/routes/sitemap.xml/+server";

// Mock database
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
}));
import db from "$lib/server/database";

describe("Sitemap GET", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should generate sitemap with static and dynamic pages", async () => {
		// Mock DB responses
		vi.mocked(db)
			.mockResolvedValueOnce([{ handle: "asso-1" }, { handle: "asso-2" }]) // Associations
			.mockResolvedValueOnce([{ handle: "list-1" }]); // Lists

		const response = await GET({} as any);

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/xml; charset=utf-8");

		const text = await response.text();

		// Check static pages
		expect(text).toContain("<loc>https://portail-etu.emse.fr/</loc>");
		expect(text).toContain("<loc>https://portail-etu.emse.fr/associations</loc>");

		// Check dynamic pages
		expect(text).toContain("<loc>https://portail-etu.emse.fr/associations/asso-1</loc>");
		expect(text).toContain("<loc>https://portail-etu.emse.fr/associations/asso-2</loc>");
		expect(text).toContain("<loc>https://portail-etu.emse.fr/lists/list-1</loc>");
	});
});
