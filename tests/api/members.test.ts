import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PUT, DELETE } from "../../src/routes/api/members/+server";
import db from "$lib/server/database";
import {
	requireAuth,
	getAuthorizedAssociationIds,
	checkAssociationPermission,
} from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";
import type { RequestEvent } from "@sveltejs/kit";

// Mock dependencies
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
}));

vi.mock("$lib/server/auth-middleware", () => ({
	requireAuth: vi.fn(),
	getAuthorizedAssociationIds: vi.fn(),
	checkAssociationPermission: vi.fn(),
}));

describe("Members API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /api/members", () => {
		it("should return all members for admin", async () => {
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });
			(getAuthorizedAssociationIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null); // Admin
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, user_id: 1 }]);

			const request = new Request("http://localhost/api/members");
			const event = { request } as RequestEvent;

			const response = await GET(event);
			const data = await response.json();

			expect(data).toHaveLength(1);
			expect(data[0].id).toBe(1);
		});

		it("should return filtered members for authorized user", async () => {
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });
			(getAuthorizedAssociationIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue([1, 2]);
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, association_id: 1 }]);

			const request = new Request("http://localhost/api/members");
			const event = { request } as RequestEvent;

			const response = await GET(event);
			const data = await response.json();

			expect(data).toHaveLength(1);
			expect(db).toHaveBeenCalledWith(expect.anything(), [1, 2]); // Check if query used the IDs
		});

		it("should return empty list if no authorized associations", async () => {
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });
			(getAuthorizedAssociationIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue([]);

			const request = new Request("http://localhost/api/members");
			const event = { request } as RequestEvent;

			const response = await GET(event);
			const data = await response.json();

			expect(data).toEqual([]);
			expect(db).not.toHaveBeenCalled();
		});
	});

	describe("POST /api/members", () => {
		it("should create member if authorized", async () => {
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/members", {
				method: "POST",
				body: JSON.stringify({ user_id: 1, association_id: 1, role_id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.success).toBe(true);
			expect(db).toHaveBeenCalled();
		});

		it("should fail if unauthorized", async () => {
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response("Unauthorized", { status: 403 }),
			});

			const request = new Request("http://localhost/api/members", {
				method: "POST",
				body: JSON.stringify({ user_id: 1, association_id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(403);
			expect(db).not.toHaveBeenCalled();
		});
	});

	describe("PUT /api/members", () => {
		it("should update member if authorized", async () => {
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ association_id: 1 }]); // Existing member
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});

			const request = new Request("http://localhost/api/members", {
				method: "PUT",
				body: JSON.stringify({ id: 1, user_id: 1, association_id: 1, role_id: 2 }),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(db).toHaveBeenCalledTimes(2); // Select + Update
		});
	});

	describe("DELETE /api/members", () => {
		it("should delete member if authorized", async () => {
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ association_id: 1 }]); // Existing member
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});

			const request = new Request("http://localhost/api/members", {
				method: "DELETE",
				body: JSON.stringify({ id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await DELETE(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(db).toHaveBeenCalledTimes(2); // Select + Delete
		});
	});
});
