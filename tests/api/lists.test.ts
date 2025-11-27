import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PUT, DELETE } from "../../src/routes/api/lists/+server";
import db, { getBasicList } from "$lib/server/database";
import { checkPermission } from "$lib/server/auth-middleware";
import type { RequestEvent } from "@sveltejs/kit";

// Mock dependencies
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
	getBasicList: vi.fn(),
}));

vi.mock("$lib/server/auth-middleware", () => ({
	checkPermission: vi.fn(),
}));

describe("Lists API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /api/lists", () => {
		it("should return list of lists with association names", async () => {
			const mockRawLists = [{ id: 1, association_id: 1, name: "List 1" }];
			const mockBasicList = { id: 1, association_id: 1, name: "List 1", iconUrl: "url" };
			const mockAssociations = [{ id: 1, name: "Asso 1" }];

			(db as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce(mockRawLists) // First call for lists
				.mockResolvedValueOnce(mockAssociations); // Second call for associations

			(getBasicList as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockBasicList);

			const response = await GET();
			const data = await response.json();

			expect(data).toEqual([{ ...mockBasicList, association_name: "Asso 1" }]);
			expect(db).toHaveBeenCalledTimes(2);
		});

		it("should have specific association_name when association id does not match", async () => {
			const mockRawLists = [{ id: 1, association_id: 999, name: "List 1" }];
			const mockBasicList = { id: 1, association_id: 999, name: "List 1", iconUrl: "url" };
			const mockAssociations = [{ id: 1, name: "Asso 1" }];

			(db as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce(mockRawLists) // First call for lists
				.mockResolvedValueOnce(mockAssociations); // Second call for associations

			(getBasicList as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockBasicList);

			const response = await GET();
			const data = await response.json();

			expect(data).toEqual([{ ...mockBasicList, association_name: "Association inconnue" }]);
			expect(db).toHaveBeenCalledTimes(2);
		});
	});

	describe("POST /api/lists", () => {
		it("should create list if authorized", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/lists", {
				method: "POST",
				body: JSON.stringify({
					handle: "list1",
					name: "List 1",
					description: "Desc",
					association_id: 1,
				}),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data).toEqual({ success: true });
		});
		it("should return 403 if unauthorized", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
			});

			const request = new Request("http://localhost/api/lists", {
				method: "POST",
				body: JSON.stringify({
					handle: "list1",
					name: "List 1",
					description: "Desc",
					association_id: 1,
				}),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			expect(response.status).toBe(403);
		});
	});

	describe("PUT /api/lists", () => {
		it("should update list if authorized", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/lists", {
				method: "PUT",
				body: JSON.stringify({
					id: 1,
					handle: "list1",
					name: "List 1 Updated",
				}),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual({ success: true });
		});

		it("should return 403 if unauthorized", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
			});

			const request = new Request("http://localhost/api/lists", {
				method: "PUT",
				body: JSON.stringify({
					id: 1,
					handle: "list1",
					name: "List 1 Updated",
				}),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);
			expect(response.status).toBe(403);
		});
	});

	describe("DELETE /api/lists", () => {
		it("should delete list if authorized", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/lists", {
				method: "DELETE",
				body: JSON.stringify({ id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await DELETE(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual({ success: true });
		});
		it("should return 403 if unauthorized", async () => {
			(checkPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
			});

			const request = new Request("http://localhost/api/lists", {
				method: "DELETE",
				body: JSON.stringify({ id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await DELETE(event);
			expect(response.status).toBe(403);
		});
	});
});
