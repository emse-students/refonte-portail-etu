import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RawAssociation } from "$lib/databasetypes";

// 1. Mock the database module
vi.mock("$lib/server/database", () => {
	return {
		// Mock the default export (the db function)
		default: vi.fn(),
		// We can keep the original implementation of helper functions if we want,
		// or mock them too. Here we mock the default db query function.
		getBasicAssociation: vi.fn(),
	};
});

// Import the mocked module
import db from "$lib/server/database";

describe("Database Mocking Pattern", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return typed mock data", async () => {
		// Define data matching RawAssociation type
		const mockData: RawAssociation[] = [
			{
				id: 1,
				handle: "bde",
				name: "Bureau des Élèves",
				description: "Description",
				icon: 123,
				color: 0x000000,
				created_at: new Date(),
				edited_at: new Date(),
				archived: false,
			},
		];

		// Configure mock to return this data
		(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

		// Simulate a DB call
		const result = await db<RawAssociation>`SELECT * FROM association`;

		// Verify
		expect(result).toEqual(mockData);
		expect(result[0].handle).toBe("bde");
	});
});
