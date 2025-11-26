import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as GET_ICS } from "../../src/routes/api/calendar/calendar.ics/+server";
import { GET as GET_JSON } from "../../src/routes/api/calendar/+server";
import db, { getPool, escape } from "$lib/server/database";
import {
	requireAuth,
	getAuthorizedAssociationIds,
	getAuthorizedListIds,
} from "$lib/server/auth-middleware";
import type { RequestEvent } from "@sveltejs/kit";
import Permission from "$lib/permissions";

// Mock dependencies
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
	getPool: vi.fn(),
	escape: vi.fn((val) => `'${val}'`),
}));

vi.mock("$lib/server/auth-middleware", () => ({
	requireAuth: vi.fn(),
	getAuthorizedAssociationIds: vi.fn(),
	getAuthorizedListIds: vi.fn(),
}));

describe("Calendar API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
			query: vi.fn().mockResolvedValue([]),
		});
	});

	describe("ICS Endpoint", () => {
		it("should return correct ICS headers", async () => {
			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const response = await GET_ICS();

			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe("text/calendar; charset=utf-8");
			expect(response.headers.get("Content-Disposition")).toBe(
				'attachment; filename="calendar.ics"'
			);
		});

		it("should generate valid ICS content for events", async () => {
			const mockDate = new Date("2023-01-01T12:00:00Z");
			const mockEndDate = new Date("2023-01-01T14:00:00Z");

			const mockEvents = [
				{
					id: 1,
					title: "Test Event",
					description: "Test Description",
					location: "Test Location",
					start_date: mockDate,
					end_date: mockEndDate,
					association_id: 1,
					association_name: "Test Asso",
				},
			];

			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockEvents);

			const response = await GET_ICS();
			const text = await response.text();

			// Check basic structure
			expect(text).toContain("BEGIN:VCALENDAR");
			expect(text).toContain("VERSION:2.0");
			expect(text).toContain("END:VCALENDAR");

			// Check event details
			expect(text).toContain("BEGIN:VEVENT");
			expect(text).toContain("UID:event-1@portail-etu.emse.fr");
			expect(text).toContain("SUMMARY:Test Event");
			expect(text).toContain("DESCRIPTION:Test Description");
			expect(text).toContain("LOCATION:Test Location");
			expect(text).toContain("DTSTART:20230101T120000Z");
			expect(text).toContain("DTEND:20230101T140000Z");
			expect(text).toContain("END:VEVENT");
		});

		it("should escape special characters in ICS", async () => {
			const mockEvents = [
				{
					id: 2,
					title: "Event, with; special chars",
					description: "Line 1\nLine 2",
					location: "Room 1, Building A",
					start_date: new Date(),
					end_date: new Date(),
				},
			];

			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockEvents);

			const response = await GET_ICS();
			const text = await response.text();

			expect(text).toContain("SUMMARY:Event\\, with\\; special chars");
			expect(text).toContain("DESCRIPTION:Line 1\\nLine 2");
			expect(text).toContain("LOCATION:Room 1\\, Building A");
		});

		it("should handle missing optional fields", async () => {
			const mockEvents = [
				{
					id: 3,
					title: null, // Should default to (no title)
					description: null, // Should default to association name or empty
					location: null,
					start_date: new Date(),
					end_date: new Date(),
					association_name: "My Asso",
				},
			];

			(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockEvents);

			const response = await GET_ICS();
			const text = await response.text();

			expect(text).toContain("SUMMARY:(no title)");
			expect(text).toContain("DESCRIPTION:Association: My Asso");
			expect(text).not.toContain("LOCATION:");
		});
	});

	describe("JSON Endpoint", () => {
		it("should return public events by default", async () => {
			const mockEvents = [{ id: 1, title: "Public Event", validated: true }];
			const queryMock = vi.fn().mockResolvedValue([mockEvents]);
			(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: queryMock });
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			const url = new URL("http://localhost/api/calendar?start=2023-01-01&end=2023-01-31");
			const event = { url } as unknown as RequestEvent;

			const response = await GET_JSON(event);
			const data = await response.json();

			expect(data).toEqual(mockEvents);
			expect(queryMock).toHaveBeenCalled();
			const sql = queryMock.mock.calls[0][0];
			expect(sql).toContain("e.validated = 1");
		});

		it("should filter by association", async () => {
			const queryMock = vi.fn().mockResolvedValue([]);
			(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: queryMock });
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			const url = new URL("http://localhost/api/calendar?asso=1");
			const event = { url } as unknown as RequestEvent;

			await GET_JSON(event);

			const sql = queryMock.mock.calls[0][0];
			expect(sql).toContain("e.association_id = '1'");
		});

		it("should allow global admin to see unvalidated events", async () => {
			const mockUser = { id: 1 };
			const queryMock = vi.fn().mockResolvedValue([]);
			(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: queryMock });
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
			(getAuthorizedAssociationIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null); // Global admin
			(getAuthorizedListIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);

			const url = new URL("http://localhost/api/calendar?unvalidated=true");
			const event = { url } as unknown as RequestEvent;

			await GET_JSON(event);

			const sql = queryMock.mock.calls[0][0];
			expect(sql).not.toContain("e.validated = 1"); // Should not enforce validation
		});

		it("should allow association admin to see their unvalidated events", async () => {
			const mockUser = { id: 2 };
			const queryMock = vi.fn().mockResolvedValue([]);
			(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: queryMock });
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
			(getAuthorizedAssociationIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue([10]);
			(getAuthorizedListIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue([20]);

			const url = new URL("http://localhost/api/calendar?unvalidated=true");
			const event = { url } as unknown as RequestEvent;

			await GET_JSON(event);

			const sql = queryMock.mock.calls[0][0];
			expect(sql).toContain("(e.validated = 1 OR e.association_id IN (10) OR e.list_id IN (20))");
		});

		it("should restrict unvalidated access for normal users", async () => {
			const mockUser = { id: 3 };
			const queryMock = vi.fn().mockResolvedValue([]);
			(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: queryMock });
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
			(getAuthorizedAssociationIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue([]);
			(getAuthorizedListIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue([]);

			const url = new URL("http://localhost/api/calendar?unvalidated=true");
			const event = { url } as unknown as RequestEvent;

			await GET_JSON(event);

			const sql = queryMock.mock.calls[0][0];
			expect(sql).toContain("(e.validated = 1)"); // Only validated events
		});

		it("should handle requestAll for global admin", async () => {
			const mockUser = { id: 1 };
			const queryMock = vi.fn().mockResolvedValue([]);
			(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: queryMock });
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
			(getAuthorizedAssociationIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null); // Global admin

			const url = new URL("http://localhost/api/calendar?unvalidated=true&all=true");
			const event = { url } as unknown as RequestEvent;

			await GET_JSON(event);

			const sql = queryMock.mock.calls[0][0];
			expect(sql).not.toContain("e.validated = 1");
		});

		it("should allow access if only list permission is global", async () => {
			const mockUser = { id: 1 };
			const queryMock = vi.fn().mockResolvedValue([]);
			(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: queryMock });
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
			(getAuthorizedAssociationIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue([]);
			(getAuthorizedListIds as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null); // Global list admin

			const url = new URL("http://localhost/api/calendar?unvalidated=true");
			const event = { url } as unknown as RequestEvent;

			await GET_JSON(event);

			const sql = queryMock.mock.calls[0][0];
			expect(sql).not.toContain("e.validated = 1");
		});

		it("should ignore requestAll if not authenticated", async () => {
			const queryMock = vi.fn().mockResolvedValue([]);
			(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: queryMock });
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			const url = new URL("http://localhost/api/calendar?unvalidated=true&all=true");
			const event = { url } as unknown as RequestEvent;

			await GET_JSON(event);

			const sql = queryMock.mock.calls[0][0];
			expect(sql).toContain("e.validated = 1");
		});
	});
});
