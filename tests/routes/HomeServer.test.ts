import { describe, it, expect, vi, beforeEach } from "vitest";
import { load } from "../../src/routes/+page.server";

// Mock database
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
	getPool: vi.fn(() => ({
		query: vi.fn(),
	})),
}));

import db, { getPool } from "$lib/server/database";

describe("+page.server.ts (Home)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns eventSubmissionOpen as true when config is true", async () => {
		vi.mocked(getPool).mockReturnValue({
			query: vi.fn().mockResolvedValue({ rows: [] }),
		} as any);
		vi.mocked(db).mockResolvedValue([{ value: "true" }]);

		const result = (await load({} as any)) as any;

		expect(result.eventSubmissionOpen).toBe(true);
	});

	it("returns eventSubmissionOpen as false when config is false", async () => {
		vi.mocked(getPool).mockReturnValue({
			query: vi.fn().mockResolvedValue({ rows: [] }),
		} as any);
		vi.mocked(db).mockResolvedValue([{ value: "false" }]);

		const result = (await load({} as any)) as any;

		expect(result.eventSubmissionOpen).toBe(false);
	});

	it("returns eventSubmissionOpen as false when no config found", async () => {
		vi.mocked(getPool).mockReturnValue({
			query: vi.fn().mockResolvedValue({ rows: [] }),
		} as any);
		vi.mocked(db).mockResolvedValue([]);

		const result = (await load({} as any)) as any;

		expect(result.eventSubmissionOpen).toBe(false);
	});

	it("returns eventSubmissionOpen as false on database error", async () => {
		vi.mocked(getPool).mockReturnValue({
			query: vi.fn().mockResolvedValue({ rows: [] }),
		} as any);
		vi.mocked(db).mockRejectedValue(new Error("Database error"));

		// Suppress console.error for this test
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const result = (await load({} as any)) as any;

		expect(result.eventSubmissionOpen).toBe(false);
		expect(consoleSpy).toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	it("creates config table if not exists", async () => {
		const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
		vi.mocked(getPool).mockReturnValue({
			query: mockQuery,
		} as any);
		vi.mocked(db).mockResolvedValue([{ value: "true" }]);

		await load({} as any);

		expect(mockQuery).toHaveBeenCalledWith(
			expect.stringContaining("CREATE TABLE IF NOT EXISTS config")
		);
	});

	it("handles getPool error gracefully", async () => {
		vi.mocked(getPool).mockReturnValue({
			query: vi.fn().mockRejectedValue(new Error("Pool error")),
		} as any);

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const result = (await load({} as any)) as any;

		expect(result.eventSubmissionOpen).toBe(false);

		consoleSpy.mockRestore();
	});
});
