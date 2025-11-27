import { describe, it, expect, vi, beforeEach } from "vitest";
import { load as loadAssociations } from "../../src/routes/associations/+page";
import { load as loadLists } from "../../src/routes/lists/+page";

// Mock $app/paths
vi.mock("$app/paths", () => ({
	resolve: (path: string) => path,
}));

describe("associations/+page.ts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("fetches associations from API", async () => {
		const mockAssociations = [
			{ id: 1, name: "Association 1", handle: "asso-1" },
			{ id: 2, name: "Association 2", handle: "asso-2" },
		];

		const mockFetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(mockAssociations),
		});

		const result = await loadAssociations({
			fetch: mockFetch,
		} as any);

		expect(mockFetch).toHaveBeenCalledWith("/api/associations");
		expect(result.associations).toEqual(mockAssociations);
	});

	it("returns empty array when no associations", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve([]),
		});

		const result = await loadAssociations({
			fetch: mockFetch,
		} as any);

		expect(result.associations).toEqual([]);
	});

	it("handles API response with all association fields", async () => {
		const mockAssociations = [
			{
				id: 1,
				name: "Full Association",
				handle: "full-asso",
				description: "A full description",
				icon: "/logo.png",
				color: 255,
			},
		];

		const mockFetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(mockAssociations),
		});

		const result = await loadAssociations({
			fetch: mockFetch,
		} as any);

		expect(result.associations[0].name).toBe("Full Association");
		expect(result.associations[0].description).toBe("A full description");
	});
});

describe("lists/+page.ts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("fetches lists from API", async () => {
		const mockLists = [
			{ id: 1, name: "List 1", handle: "list-1" },
			{ id: 2, name: "List 2", handle: "list-2" },
		];

		const mockFetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(mockLists),
		});

		const result = await loadLists({
			fetch: mockFetch,
		} as any);

		expect(mockFetch).toHaveBeenCalledWith("/api/lists");
		expect(result.lists).toEqual(mockLists);
	});

	it("returns empty array when no lists", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve([]),
		});

		const result = await loadLists({
			fetch: mockFetch,
		} as any);

		expect(result.lists).toEqual([]);
	});

	it("handles API response with all list fields", async () => {
		const mockLists = [
			{
				id: 1,
				name: "Full List",
				handle: "full-list",
				association_id: 5,
				description: "A full description",
				icon: "/logo.png",
				promo: 2024,
				color: 128,
			},
		];

		const mockFetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(mockLists),
		});

		const result = await loadLists({
			fetch: mockFetch,
		} as any);

		expect(result.lists[0].name).toBe("Full List");
		expect(result.lists[0].promo).toBe(2024);
	});

	it("handles multiple lists correctly", async () => {
		const mockLists = Array.from({ length: 10 }, (_, i) => ({
			id: i + 1,
			name: `List ${i + 1}`,
			handle: `list-${i + 1}`,
		}));

		const mockFetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve(mockLists),
		});

		const result = await loadLists({
			fetch: mockFetch,
		} as any);

		expect(result.lists).toHaveLength(10);
		expect(result.lists[9].name).toBe("List 10");
	});
});
