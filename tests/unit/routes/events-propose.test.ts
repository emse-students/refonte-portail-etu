import { describe, it, expect, vi, beforeEach } from "vitest";
import { load } from "../../../src/routes/events/propose/+page.server";
import { redirect } from "@sveltejs/kit";
import Permission from "$lib/permissions";

// Mock dependencies
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
}));
import db from "$lib/server/database";

vi.mock("$lib/server/auth-middleware", () => ({
	requireAuth: vi.fn(),
	getAuthorizedAssociationIds: vi.fn(),
	getAuthorizedListIds: vi.fn(),
}));
import {
	requireAuth,
	getAuthorizedAssociationIds,
	getAuthorizedListIds,
} from "$lib/server/auth-middleware";

describe("Events Propose Page Server Load", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should redirect to login if user is not authenticated", async () => {
		vi.mocked(requireAuth).mockResolvedValue(null);

		try {
			await load({} as any);
			expect.fail("Should have thrown redirect");
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe("/auth/login");
		}
	});

	it("should redirect to home if submission is closed and user is not admin", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		// Mock config: submission closed
		vi.mocked(db).mockResolvedValueOnce([]); // No config found or false
		// Mock permissions: user has some association permissions (not global admin)
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue([1]);
		vi.mocked(getAuthorizedListIds).mockReturnValue([]);

		try {
			await load({} as any);
			expect.fail("Should have thrown redirect");
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe("/");
		}
	});

	it("should allow access if submission is closed but user is global admin", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		vi.mocked(db).mockResolvedValueOnce([]); // Submission closed
		// Global admin (returns null)
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue(null);
		vi.mocked(getAuthorizedListIds).mockReturnValue(null);

		// Mock fetching all associations and lists
		vi.mocked(db)
			.mockResolvedValueOnce([{ id: 1, name: "Asso A" }]) // Associations
			.mockResolvedValueOnce([{ id: 1, name: "List A" }]); // Lists

		const result = (await load({} as any)) as any;

		expect(result.isOpen).toBe(false);
		expect(result.associations).toHaveLength(1);
		expect(result.lists).toHaveLength(1);
	});

	it("should return authorized associations and lists when submission is open", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		// Mock config: submission open
		vi.mocked(db).mockResolvedValueOnce([{ value: "true" }]);

		// User has specific permissions
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue([10]);
		vi.mocked(getAuthorizedListIds).mockReturnValue([20]);

		// Mock fetching specific associations and lists
		vi.mocked(db)
			.mockResolvedValueOnce([{ id: 10, name: "My Asso" }])
			.mockResolvedValueOnce([{ id: 20, name: "My List" }]);

		const result = (await load({} as any)) as any;

		expect(result.isOpen).toBe(true);
		expect(result.associations[0].name).toBe("My Asso");
		expect(result.lists[0].name).toBe("My List");

		// Verify DB queries used IDs
		expect(db).toHaveBeenCalledWith(expect.anything(), [10]);
		expect(db).toHaveBeenCalledWith(expect.anything(), [20]);
	});
});
