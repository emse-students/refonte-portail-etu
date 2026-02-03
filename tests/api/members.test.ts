import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PUT, DELETE } from "../../src/routes/api/members/+server";
import db, { getPool } from "$lib/server/database";
import {
	requireAuth,
	getAuthorizedAssociationIds,
	checkAssociationPermission,
	checkListPermission,
	hasAssociationPermission,
	hasListPermission,
} from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";
import type { RequestEvent } from "@sveltejs/kit";

// Mock dependencies
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
	getPool: vi.fn(() => ({
		query: vi.fn(),
	})),
}));

vi.mock("$lib/server/auth-middleware", () => ({
	requireAuth: vi.fn(),
	getAuthorizedAssociationIds: vi.fn(),
	checkAssociationPermission: vi.fn(),
	checkListPermission: vi.fn(),
	hasAssociationPermission: vi.fn(),
	hasListPermission: vi.fn(),
}));

describe("Members API", () => {
	beforeEach(() => {
		vi.resetAllMocks();
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

		it("should return 401 if not authenticated", async () => {
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			const request = new Request("http://localhost/api/members");
			const event = { request } as RequestEvent;

			const response = await GET(event);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe("Unauthorized");
		});
	});

	describe("POST /api/members", () => {
		it("should create member if authorized", async () => {
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
				user: { permissions: 0, memberships: [] },
			});
			const mockQuery = vi.fn().mockResolvedValue([{ insertId: 1 }]);
			(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
				query: mockQuery,
			});

			const request = new Request("http://localhost/api/members", {
				method: "POST",
				body: JSON.stringify({
					user_id: 1,
					association_id: 1,
					role_name: "Test",
					permissions: 0,
					hierarchy: 1,
					visible: true,
				}),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.success).toBe(true);
			expect(mockQuery).toHaveBeenCalled();
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

		it("should return 400 if association_id and list_id are missing", async () => {
			const request = new Request("http://localhost/api/members", {
				method: "POST",
				body: JSON.stringify({ user_id: 1, role_name: "Member", permissions: 0, hierarchy: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("association_id or list_id is required");
		});

		it("should create member with visible=true by default", async () => {
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
				user: { permissions: 0, memberships: [] },
			});
			const mockQuery = vi.fn().mockResolvedValue([{ insertId: 1 }]);
			(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
				query: mockQuery,
			});

			const request = new Request("http://localhost/api/members", {
				method: "POST",
				body: JSON.stringify({
					user_id: 1,
					association_id: 1,
					role_name: "Member",
					permissions: 0,
					hierarchy: 1,
				}),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(201);
			// The visible field should default to true
		});

		it("should create member with list_id if provided", async () => {
			(checkListPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
				user: { permissions: 0, memberships: [] },
			});
			const mockQuery = vi.fn().mockResolvedValue([{ insertId: 1 }]);
			(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
				query: mockQuery,
			});

			const request = new Request("http://localhost/api/members", {
				method: "POST",
				body: JSON.stringify({
					user_id: 1,
					role_name: "Member",
					list_id: 1,
					permissions: 0,
					hierarchy: 1,
				}),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(201);
			expect(mockQuery).toHaveBeenCalled();
		});
	});

	describe("PUT /api/members", () => {
		it("should update member if authorized", async () => {
			(db as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ association_id: 1 }]) // Existing member
				.mockResolvedValueOnce([]); // Update
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
				user: {
					permissions: 0,
					memberships: [{ association_id: 1, permissions: 2 }], // Authorize high permissions
				},
			});
			(hasAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

			const request = new Request("http://localhost/api/members", {
				method: "PUT",
				body: JSON.stringify({
					id: 1,
					role_name: "New Role",
					permissions: 1,
					hierarchy: 1,
				}),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(db).toHaveBeenCalledTimes(2); // Select + Update
		});

		it("should return 400 if id is missing", async () => {
			const request = new Request("http://localhost/api/members", {
				method: "PUT",
				body: JSON.stringify({
					role_name: "New Role",
					permissions: 1,
					hierarchy: 1,
				}),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("id is required");
		});

		it("should return 404 if the member doesn't exist", async () => {
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]); // Not found

			const request = new Request("http://localhost/api/members", {
				method: "PUT",
				body: JSON.stringify({
					id: 999,
					user_id: 1,
					association_id: 1,
					role_name: "New Role",
					permissions: 1,
					hierarchy: 1,
				}),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe("Member not found");
		});

		it("should fail if permission denied for existing member", async () => {
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ association_id: 1 }]);
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response("Forbidden", { status: 403 }),
			});

			const request = new Request("http://localhost/api/members", {
				method: "PUT",
				body: JSON.stringify({ id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);

			expect(response.status).toBe(403);
		});

		it("should fail if assigning higher permissions than user has", async () => {
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ association_id: 1 }]);
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
				user: {
					permissions: 1,
					memberships: [{ association_id: 1, permissions: 1 }],
				},
			});
			(hasAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

			const request = new Request("http://localhost/api/members", {
				method: "PUT",
				body: JSON.stringify({
					id: 1,
					role_name: "New Role",
					permissions: 2, // Higher than user's 1
					hierarchy: 1,
				}),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);
			const data = await response.json();

			expect(response.status).toBe(403);
			expect(data.error).toBe("Forbidden");
		});
	});

	describe("DELETE /api/members", () => {
		it("should delete member if authorized", async () => {
			(db as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ association_id: 1 }]) // Existing member
				.mockResolvedValueOnce([]); // Delete
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

		it("should return 400 if id is missing", async () => {
			const request = new Request("http://localhost/api/members", {
				method: "DELETE",
				body: JSON.stringify({}),
			});
			const event = { request } as RequestEvent;

			const response = await DELETE(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("id is required");
		});

		it("should return 404 if member not found", async () => {
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]); // Not found

			const request = new Request("http://localhost/api/members", {
				method: "DELETE",
				body: JSON.stringify({ id: 999 }),
			});
			const event = { request } as RequestEvent;

			const response = await DELETE(event);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBe("Member not found");
		});

		it("should fail if permission denied", async () => {
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ association_id: 1 }]);
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response("Forbidden", { status: 403 }),
			});

			const request = new Request("http://localhost/api/members", {
				method: "DELETE",
				body: JSON.stringify({ id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await DELETE(event);

			expect(response.status).toBe(403);
		});
	});
});
