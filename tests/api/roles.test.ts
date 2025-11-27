import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PUT, DELETE } from "../../src/routes/api/roles/+server";
import db from "$lib/server/database";
import { checkPermission, checkAssociationPermission } from "$lib/server/auth-middleware";
import Permission, { hasPermission } from "$lib/permissions";
import type { RequestEvent } from "@sveltejs/kit";

// Mock dependencies
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
}));

vi.mock("$lib/server/auth-middleware", () => ({
	checkPermission: vi.fn(),
	checkAssociationPermission: vi.fn(),
}));

vi.mock("$lib/permissions", async (importOriginal) => {
	const actual = await importOriginal<typeof import("$lib/permissions")>();
	return {
		...actual,
		hasPermission: vi.fn(),
	};
});

describe("Roles API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /api/roles", () => {
		it("should return all roles", async () => {
			const mockRoles = [{ id: 1, name: "Admin" }];
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);

			const response = await GET();
			const data = await response.json();

			expect(data).toEqual(mockRoles);
		});
	});

	describe("POST /api/roles", () => {
		it("should create role if authorized (Global)", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
				user: { permissions: Permission.ADMIN },
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1 }]);

			const request = new Request("http://localhost/api/roles", {
				method: "POST",
				body: JSON.stringify({ name: "New Role", permissions: 0 }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.success).toBe(true);
		});

		it("should create role if authorized (Association)", async () => {
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
				user: {
					permissions: 0,
					memberships: [{ association_id: 1, role: { permissions: Permission.ADMIN } }],
				},
			});
			(hasPermission as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1 }]);

			const request = new Request("http://localhost/api/roles", {
				method: "POST",
				body: JSON.stringify({ name: "New Role", permissions: 0, association_id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(201);
		});

		it("should fail if permissions exceed user permissions", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
				user: { permissions: 0 }, // User has no permissions
			});

			const request = new Request("http://localhost/api/roles", {
				method: "POST",
				body: JSON.stringify({ name: "Super Role", permissions: Permission.ADMIN }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(403);
			expect(data.error).toBe("Forbidden");
		});

		it("should fail if unauthorized for association-scoped role", async () => {
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
			});

			const request = new Request("http://localhost/api/roles", {
				method: "POST",
				body: JSON.stringify({ name: "New Role", permissions: 0, association_id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(403);
		});

		it("should fail if unauthorized for global role", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
			});

			const request = new Request("http://localhost/api/roles", {
				method: "POST",
				body: JSON.stringify({ name: "New Role", permissions: 0 }),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(403);
		});

		it("should grant max permissions if user is global admin", async () => {
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
				user: {
					permissions: Permission.ADMIN,
					memberships: [],
				},
			});
			(hasPermission as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1 }]);

			const request = new Request("http://localhost/api/roles", {
				method: "POST",
				body: JSON.stringify({
					name: "New Role",
					permissions: Permission.SITE_ADMIN,
					association_id: 1,
				}),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(201);
		});

		it("should create role with default hierarchy and permissions", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
				user: { permissions: Permission.ADMIN },
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1 }]);

			const request = new Request("http://localhost/api/roles", {
				method: "POST",
				body: JSON.stringify({ name: "New Role" }), // No hierarchy or permissions
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.success).toBe(true);
		});
	});

	describe("PUT /api/roles", () => {
		it("should update role if authorized", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/roles", {
				method: "PUT",
				body: JSON.stringify({ id: 1, name: "Updated Role", hierarchy: 5, permissions: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
		});

		it("should fail if unauthorized", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
			});

			const request = new Request("http://localhost/api/roles", {
				method: "PUT",
				body: JSON.stringify({ id: 1, name: "Updated Role" }),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);

			expect(response.status).toBe(403);
		});
	});

	describe("DELETE /api/roles", () => {
		it("should delete role if authorized", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/roles", {
				method: "DELETE",
				body: JSON.stringify({ id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await DELETE(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
		});

		it("should fail if unauthorized", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
			});

			const request = new Request("http://localhost/api/roles", {
				method: "DELETE",
				body: JSON.stringify({ id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await DELETE(event);

			expect(response.status).toBe(403);
		});
	});
});
