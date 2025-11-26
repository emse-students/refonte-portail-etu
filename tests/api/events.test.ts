import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PUT, DELETE } from "../../src/routes/api/events/+server";
import db from "$lib/server/database";
import {
	requireAuth,
	getAuthorizedAssociationIds,
	getAuthorizedListIds,
	checkAssociationPermission,
	checkListPermission,
} from "$lib/server/auth-middleware";
import type { RequestEvent } from "@sveltejs/kit";
import Permission from "$lib/permissions";

// Mock dependencies
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
}));

vi.mock("$lib/server/auth-middleware", () => ({
	requireAuth: vi.fn(),
	getAuthorizedAssociationIds: vi.fn(),
	getAuthorizedListIds: vi.fn(),
	checkAssociationPermission: vi.fn(),
	checkListPermission: vi.fn(),
}));

describe("Events API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /api/events", () => {
		it("should return public events", async () => {
			const mockEvents = [{ id: 1, title: "Public Event" }];
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockEvents);

			const request = new Request("http://localhost/api/events");
			const event = {
				request,
				url: new URL("http://localhost/api/events"),
			} as unknown as RequestEvent;

			const response = await GET(event);
			const data = await response.json();

			expect(data).toEqual(mockEvents);
			expect(db).toHaveBeenCalled();
		});

		it("should return editable events for authorized user", async () => {
			const mockEvents = [{ id: 2, title: "Editable Event" }];
			const mockUser = { id: 1, email: "test@test.com" };

			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
			(getAuthorizedAssociationIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue([1]);
			(getAuthorizedListIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue([]);
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockEvents);

			const request = new Request("http://localhost/api/events?editable=true");
			const event = {
				request,
				url: new URL("http://localhost/api/events?editable=true"),
			} as unknown as RequestEvent;

			const response = await GET(event);
			const data = await response.json();

			expect(data).toEqual(mockEvents);
			expect(requireAuth).toHaveBeenCalled();
		});

		it("should return 401 if not authenticated for editable events", async () => {
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			const request = new Request("http://localhost/api/events?editable=true");
			const event = {
				request,
				url: new URL("http://localhost/api/events?editable=true"),
			} as unknown as RequestEvent;

			const response = await GET(event);

			expect(response.status).toBe(401);
		});
	});

	describe("POST /api/events", () => {
		it("should create event if authorized", async () => {
			const mockUser = { id: 1 };
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(getAuthorizedAssociationIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null); // Global manager
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const request = new Request("http://localhost/api/events", {
				method: "POST",
				body: JSON.stringify({
					association_id: 1,
					title: "New Event",
					description: "Desc",
					start_date: new Date().toISOString(),
					end_date: new Date().toISOString(),
					location: "Loc",
				}),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data).toEqual({ success: true });
		});

		it("should fail if unauthorized", async () => {
			const mockUser = { id: 1 };
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: false,
				response: new Response("Unauthorized", { status: 403 }),
			});

			const request = new Request("http://localhost/api/events", {
				method: "POST",
				body: JSON.stringify({
					association_id: 1,
					title: "New Event",
				}),
			});
			const event = { request } as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(403);
		});
	});

	describe("PUT /api/events", () => {
		it("should update event if authorized", async () => {
			const mockUser = { id: 1 };
			const mockExistingEvent = { id: 1, association_id: 1, validated: true };

			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
			(db as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([mockExistingEvent]) // First call for existing event
				.mockResolvedValueOnce([]); // Second call for update

			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});
			(getAuthorizedAssociationIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null); // Global manager

			const request = new Request("http://localhost/api/events", {
				method: "PUT",
				body: JSON.stringify({
					id: 1,
					association_id: 1,
					title: "Updated Event",
					description: "Desc",
					start_date: new Date().toISOString(),
					end_date: new Date().toISOString(),
					location: "Loc",
				}),
			});
			const event = { request } as RequestEvent;

			const response = await PUT(event);
			const data = await response.json();

			expect(data).toEqual({ success: true });
		});
	});

	describe("DELETE /api/events", () => {
		it("should delete event if authorized", async () => {
			const mockExistingEvent = { id: 1, association_id: 1 };

			(db as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([mockExistingEvent]) // First call for existing event
				.mockResolvedValueOnce([]); // Second call for delete

			(checkAssociationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
				authorized: true,
			});

			const request = new Request("http://localhost/api/events", {
				method: "DELETE",
				body: JSON.stringify({ id: 1 }),
			});
			const event = { request } as RequestEvent;

			const response = await DELETE(event);
			const data = await response.json();

			expect(data).toEqual({ success: true });
		});
	});
});
