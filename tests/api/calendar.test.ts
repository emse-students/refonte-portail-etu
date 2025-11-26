import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../../src/routes/api/calendar/calendar.ics/+server";
import db from "$lib/server/database";

// Mock database
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
}));

describe("Calendar ICS API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return correct ICS headers", async () => {
		(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

		const response = await GET();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/calendar; charset=utf-8");
		expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="calendar.ics"');
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

		const response = await GET();
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

		const response = await GET();
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

		const response = await GET();
		const text = await response.text();

		expect(text).toContain("SUMMARY:(no title)");
		expect(text).toContain("DESCRIPTION:Association: My Asso");
		expect(text).not.toContain("LOCATION:");
	});
});
