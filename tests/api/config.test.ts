import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../../src/routes/api/config/+server";
import db, { getPool } from "$lib/server/database";
import { requireAuth } from "$lib/server/auth-middleware";
import Permission, { hasPermission } from "$lib/permissions";
import type { RequestEvent } from "@sveltejs/kit";

// Mock dependencies
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
	getPool: vi.fn(),
}));

vi.mock("$lib/server/auth-middleware", () => ({
	requireAuth: vi.fn(),
}));

vi.mock("$lib/permissions", async (importOriginal) => {
	const actual = await importOriginal<typeof import("$lib/permissions")>();
	return {
		...actual,
		hasPermission: vi.fn(),
	};
});

describe("Config API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
			query: vi.fn().mockResolvedValue([]),
		});
	});

	describe("GET /api/config", () => {
		it("should return config object", async () => {
			const mockRows = [
				{ key_name: "site_name", value: "My Site" },
				{ key_name: "maintenance", value: "false" },
			];
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockRows);

			const response = await GET();
			const data = await response.json();

			expect(data).toEqual({
				site_name: "My Site",
				maintenance: "false",
			});
		});
	});

	describe("POST /api/config", () => {
		it("should update config if authorized (ADMIN)", async () => {
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				permissions: Permission.ADMIN,
			});
			(hasPermission as unknown as ReturnType<typeof vi.fn>).mockImplementation(
				(perms, required) => {
					return (perms & required) === required;
				}
			);
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/config", {
				method: "POST",
				body: JSON.stringify({ key: "site_name", value: "New Name" }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(db).toHaveBeenCalled();
		});

		it("should return 401 if unauthorized", async () => {
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			const request = new Request("http://localhost/api/config", {
				method: "POST",
				body: JSON.stringify({ key: "site_name", value: "New Name" }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(401);
		});

		it("should return 403 if forbidden", async () => {
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ permissions: 0 });
			(hasPermission as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

			const request = new Request("http://localhost/api/config", {
				method: "POST",
				body: JSON.stringify({ key: "site_name", value: "New Name" }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(403);
		});
	});
});
