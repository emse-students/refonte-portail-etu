import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as GET_LIST, POST as POST_CREATE } from "../../src/routes/api/associations/+server";
import { GET as GET_ONE, DELETE, PUT } from "../../src/routes/api/associations/[id]/+server";
import db, { getBasicAssociation, getAssociationWithMembers } from "$lib/server/database";
import { checkPermission, checkAssociationPermission } from "$lib/server/auth-middleware";
import type { RequestEvent } from "@sveltejs/kit";

// Mock dependencies
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
	getBasicAssociation: vi.fn(),
	getAssociationWithMembers: vi.fn(),
}));

vi.mock("$lib/server/auth-middleware", () => ({
	checkPermission: vi.fn(),
	checkAssociationPermission: vi.fn(),
}));

describe("Associations API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /api/associations", () => {
		it("should return a list of associations", async () => {
			const mockRawAssociations = [
				{ id: 1, name: "Asso 1" },
				{ id: 2, name: "Asso 2" },
			];
			const mockAssociations = [
				{ id: 1, name: "Asso 1", iconUrl: "url1" },
				{ id: 2, name: "Asso 2", iconUrl: "url2" },
			];

			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockRawAssociations);
			(getBasicAssociation as unknown as ReturnType<typeof vi.fn>).mockImplementation(
				async (raw) => {
					return mockAssociations.find((a) => a.id === raw.id);
				}
			);

			const response = await GET_LIST();
			const data = await response.json();

			expect(response.status).toBe(200); // json() returns 200 by default? No, json() helper creates a Response.
			// Wait, json() from @sveltejs/kit creates a Response object.
			// I need to check if I can call .json() on it. Yes, standard Response object.

			expect(data).toEqual(mockAssociations);
			expect(db).toHaveBeenCalled();
		});
	});

	describe("POST /api/associations", () => {
		it("should create an association if authorized", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/associations", {
				method: "POST",
				body: JSON.stringify({ name: "New Asso", description: "Desc" }),
			});

			const event = { request } as RequestEvent;

			const response = await POST_CREATE(event);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data).toEqual({ success: true });
			expect(db).toHaveBeenCalled();
		});

		it("should return 403 if unauthorized", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response("Unauthorized", { status: 403 }),
			});

			const request = new Request("http://localhost/api/associations", {
				method: "POST",
				body: JSON.stringify({ name: "New Asso" }),
			});

			const event = { request } as RequestEvent;

			const response = await POST_CREATE(event);

			expect(response.status).toBe(403);
			expect(db).not.toHaveBeenCalled();
		});
	});

	describe("GET /api/associations/[id]", () => {
		it("should return association details", async () => {
			const mockRawAsso = { id: 1, name: "Asso 1" };
			const mockAsso = { id: 1, name: "Asso 1", iconUrl: "url1" };

			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([mockRawAsso]);
			(getBasicAssociation as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockAsso);

			const request = new Request("http://localhost/api/associations/1");
			const event = { request, params: { id: "1" } } as unknown as RequestEvent;

			const response = await GET_ONE(event);
			const data = await response.json();

			expect(data).toEqual(mockAsso);
		});

		it("should return 404 if not found", async () => {
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/associations/999");
			const event = { request, params: { id: "999" } } as unknown as RequestEvent;

			const response = await GET_ONE(event);

			expect(response.status).toBe(404);
		});

		it("should include members if requested", async () => {
			const mockRawAsso = { id: 1, name: "Asso 1" };
			const mockAssoWithMembers = { id: 1, name: "Asso 1", members: [] };

			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([mockRawAsso]);
			(getAssociationWithMembers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockAssoWithMembers
			);

			const request = new Request("http://localhost/api/associations/1?includeMembers=true");
			const event = { request, params: { id: "1" } } as unknown as RequestEvent;

			const response = await GET_ONE(event);
			const data = await response.json();

			expect(data).toEqual(mockAssoWithMembers);
			expect(getAssociationWithMembers).toHaveBeenCalled();
		});
	});

	describe("DELETE /api/associations/[id]", () => {
		it("should delete association if authorized", async () => {
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/associations/1", { method: "DELETE" });
			const event = { request, params: { id: "1" } } as unknown as RequestEvent;

			const response = await DELETE(event);

			expect(response.status).toBe(204);
			expect(db).toHaveBeenCalled();
		});

		it("should fail if unauthorized", async () => {
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response("Unauthorized", { status: 403 }),
			});

			const request = new Request("http://localhost/api/associations/1", { method: "DELETE" });
			const event = { request, params: { id: "1" } } as unknown as RequestEvent;

			const response = await DELETE(event);

			expect(response.status).toBe(403);
			expect(db).not.toHaveBeenCalled();
		});
	});

	describe("PUT /api/associations/[id]", () => {
		it("should update association if authorized", async () => {
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/associations/1", {
				method: "PUT",
				body: JSON.stringify({ name: "Updated", description: "Desc" }),
			});
			const event = { request, params: { id: "1" } } as unknown as RequestEvent;

			const response = await PUT(event);

			expect(response.status).toBe(204);
			expect(db).toHaveBeenCalled();
		});
	});
});
