import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PUT, DELETE } from "../../src/routes/api/users/+server";
import db from "$lib/server/database";
import { checkPermission, checkAdmin } from "$lib/server/auth-middleware";
import type { RequestEvent } from "@sveltejs/kit";

// Mock dependencies
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
}));

vi.mock("$lib/server/auth-middleware", () => ({
	checkPermission: vi.fn(),
	checkAdmin: vi.fn(),
}));

describe("Users API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /api/users", () => {
		it("should return list of users", async () => {
			const mockUsers = [{ id: 1, email: "test@test.com" }];
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUsers);

			const response = await GET();
			const data = await response.json();

			expect(data).toEqual([{ ...mockUsers[0], permissions: 0 }]);
			expect(db).toHaveBeenCalled();
		});
	});

	describe("POST /api/users", () => {
		it("should create user if authorized", async () => {
			(checkAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/users", {
				method: "POST",
				body: JSON.stringify({
					first_name: "John",
					last_name: "Doe",
					email: "john@doe.com",
					login: "jdoe",
				}),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data).toEqual({ success: true });
		});

		it("should fail if unauthorized", async () => {
			(checkAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response("Unauthorized", { status: 403 }),
			});

			const request = new Request("http://localhost/api/users", {
				method: "POST",
				body: JSON.stringify({
					first_name: "John",
				}),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(403);
		});
	});

	describe("PUT /api/users", () => {
		it("should update user if authorized", async () => {
			(checkAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/users", {
				method: "PUT",
				body: JSON.stringify({
					id: 1,
					first_name: "John",
					last_name: "Doe",
				}),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);
			const data = await response.json();

			expect(data).toEqual({ success: true });
		});

		it("should fail if unauthorized", async () => {
			(checkAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response("Unauthorized", { status: 403 }),
			});

			const request = new Request("http://localhost/api/users", {
				method: "PUT",
				body: JSON.stringify({
					id: 1,
					first_name: "John",
				}),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);

			expect(response.status).toBe(403);
		});
	});

	describe("DELETE /api/users", () => {
		it("should delete user if authorized", async () => {
			(checkAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/users", {
				method: "DELETE",
				body: JSON.stringify({ id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await DELETE(event);
			const data = await response.json();

			expect(data).toEqual({ success: true });
		});

		it("should fail if unauthorized", async () => {
			(checkAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response("Unauthorized", { status: 403 }),
			});

			const request = new Request("http://localhost/api/users", {
				method: "DELETE",
				body: JSON.stringify({ id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await DELETE(event);

			expect(response.status).toBe(403);
		});
	});
});
