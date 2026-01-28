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
			(db as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ permissions: 0 }])
				.mockResolvedValueOnce([]);

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

		it("should return 400 if association_id is missing", async () => {
			const request = new Request("http://localhost/api/members", {
				method: "POST",
				body: JSON.stringify({ user_id: 1, role_id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("association_id is required");
		});

		it("should create member with visible=true by default", async () => {
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
				user: { permissions: 0, memberships: [] },
			});
			(db as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ permissions: 0 }])
				.mockResolvedValueOnce([]);

			const request = new Request("http://localhost/api/members", {
				method: "POST",
				body: JSON.stringify({ user_id: 1, association_id: 1, role_id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(201);
			// The visible field should default to true
		});

		it("should create member with list_id if provided", async () => {
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
				user: { permissions: 0, memberships: [] },
			});
			(db as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ permissions: 0 }])
				.mockResolvedValueOnce([]);

			const request = new Request("http://localhost/api/members", {
				method: "POST",
				body: JSON.stringify({ user_id: 1, association_id: 1, role_id: 1, list_id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(201);
			expect(db).toHaveBeenCalled();
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

			const request = new Request("http://localhost/api/members", {
				method: "PUT",
				body: JSON.stringify({
					id: 1,
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

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(db).toHaveBeenCalledTimes(2); // Select + Update
		});

		it("should return 400 if id is missing", async () => {
			const request = new Request("http://localhost/api/members", {
				method: "PUT",
				body: JSON.stringify({
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

			expect(response.status).toBe(400);
			expect(data.error).toBe("id and association_id are required");
		});

		it("should return 400 if association_id is missing", async () => {
			const request = new Request("http://localhost/api/members", {
				method: "PUT",
				body: JSON.stringify({
					id: 1,
					user_id: 1,
					role_name: "New Role",
					permissions: 1,
					hierarchy: 1,
				}),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("id and association_id are required");
		});

		it("should return 404 if member not found", async () => {
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
				body: JSON.stringify({ id: 1, user_id: 1, association_id: 1, role_id: 2 }),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);

			expect(response.status).toBe(403);
		});

		it("should check permission for new association when changing", async () => {
			(db as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ association_id: 1 }]) // Existing member
				.mockResolvedValueOnce([]); // Update
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce({ authorized: true, user: { permissions: 0, memberships: [] } }) // Old association
				.mockResolvedValueOnce({ authorized: true, user: { permissions: 0, memberships: [] } }); // New association

			const request = new Request("http://localhost/api/members", {
				method: "PUT",
				body: JSON.stringify({ id: 1, user_id: 1, association_id: 2, role_id: 2 }), // Different association
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);

			expect(response.status).toBe(200);
			expect(checkAssociationPermission).toHaveBeenCalledTimes(2);
		});

		it("should fail if permission denied for new association", async () => {
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ association_id: 1 }]);
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce({ authorized: true }) // Old association
				.mockResolvedValueOnce({ authorized: false }); // New association

			const request = new Request("http://localhost/api/members", {
				method: "PUT",
				body: JSON.stringify({
					id: 1,
					user_id: 1,
					association_id: 2,
					role_name: "New Role",
					permissions: 1,
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
