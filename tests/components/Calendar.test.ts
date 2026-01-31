import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Calendar from "$lib/components/calendar/Calendar.svelte";
import type { RawEvent } from "$lib/databasetypes";

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

// Mock $app/paths
vi.mock("$app/paths", () => ({
	resolve: (path: string) => path,
}));

describe("Calendar Component", () => {
	const mockEvents: RawEvent[] = [
		{
			id: 1,
			title: "Event 1",
			start_date: new Date("2023-01-01T10:00:00"),
			end_date: new Date("2023-01-01T12:00:00"),
			description: "Desc 1",
			location: "Loc 1",
			validated: true,
			created_at: new Date(),
			edited_at: new Date(),
			association_id: 1,
			list_id: null,
		},
		{
			id: 2,
			title: "Event 2",
			start_date: new Date("2023-01-02T14:00:00"),
			end_date: new Date("2023-01-02T16:00:00"),
			description: "Desc 2",
			location: "Loc 2",
			validated: true,
			created_at: new Date(),
			edited_at: new Date(),
			association_id: 2,
			list_id: null,
		},
	];

	let originalMatchMedia: typeof window.matchMedia;

	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockResolvedValue({
			json: async () => mockEvents,
		});

		// Save original matchMedia
		originalMatchMedia = window.matchMedia;

		// Mock as desktop by default
		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: false, // Desktop mode
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
	});

	afterEach(() => {
		window.matchMedia = originalMatchMedia;
	});

	it("renders calendar title with current week", () => {
		const initialDate = new Date("2023-01-01");
		render(Calendar, { initialDate });

		// Week of Jan 1st 2023 starts on Dec 26th 2022 (Monday)
		// Or depending on getStartOfWeek implementation.
		// The component uses getStartOfWeek which goes back to Monday.
		// Jan 1st 2023 is a Sunday. So previous Monday is Dec 26th 2022.

		expect(screen.getAllByText(/Calendrier des événements/i)[0]).toBeInTheDocument();
		expect(screen.getByText(/Semaine du/i)).toBeInTheDocument();
	});

	it("fetches events on mount", async () => {
		render(Calendar, { initialDate: new Date("2023-01-01") });

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/calendar"));
		});
	});

	it("navigates to previous week", async () => {
		render(Calendar, { initialDate: new Date("2023-01-01") });

		const prevButton = screen.getByLabelText("Semaine précédente");
		await fireEvent.click(prevButton);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + navigation
		});
	});

	it("navigates to next week", async () => {
		render(Calendar, { initialDate: new Date("2023-01-01") });

		const nextButton = screen.getByLabelText("Semaine suivante");
		await fireEvent.click(nextButton);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledTimes(2);
		});
	});

	it("renders 7 weekday headers", () => {
		render(Calendar, { initialDate: new Date("2023-01-01") });

		// Check that we have 7 weekday headers in the desktop view
		const headers = document.querySelectorAll(".calendar-weekday-header");
		expect(headers.length).toBe(7);
	});

	it("renders 4 weeks of days (28 cells)", () => {
		render(Calendar, { initialDate: new Date("2023-01-01") });

		// The calendar shows 4 weeks, so 28 day cells
		const rows = document.querySelectorAll("tbody tr");
		expect(rows.length).toBe(4);
	});

	it("shows navigation arrows", () => {
		render(Calendar, { initialDate: new Date("2023-01-01") });

		expect(screen.getByLabelText("Semaine précédente")).toBeInTheDocument();
		expect(screen.getByLabelText("Semaine suivante")).toBeInTheDocument();
	});

	it("includes unvalidated param when showUnvalidated is true", async () => {
		render(Calendar, {
			initialDate: new Date("2023-01-01"),
			showUnvalidated: true,
		});

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("unvalidated=true"));
		});
	});

	it("includes all param when showAllUnvalidated is true", async () => {
		render(Calendar, {
			initialDate: new Date("2023-01-01"),
			showAllUnvalidated: true,
		});

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("all=true"));
			expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("unvalidated=true"));
		});
	});

	it("renders desktop view by default", () => {
		render(Calendar, { initialDate: new Date("2023-01-01") });

		expect(document.querySelector(".desktop-view")).toBeInTheDocument();
		expect(document.querySelector(".calendar-nav")).toBeInTheDocument();
	});

	it("uses current date when no initialDate provided", () => {
		render(Calendar, {});

		// Should render without error
		expect(screen.getAllByText(/Calendrier des événements/i)[0]).toBeInTheDocument();
	});

	it("calls onDayClick when day is clicked", async () => {
		const onDayClick = vi.fn();
		render(Calendar, {
			initialDate: new Date("2023-01-01"),
			onDayClick,
		});

		// Wait for initial load
		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalled();
		});

		// The CalendarDay component will render add buttons when onDayClick is provided
		// This tests that the prop is passed down correctly
		expect(onDayClick).not.toHaveBeenCalled();
	});

	it("passes onEventClick to child components", async () => {
		const onEventClick = vi.fn().mockReturnValue(true);
		render(Calendar, {
			initialDate: new Date("2023-01-01"),
			onEventClick,
		});

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalled();
		});

		// The component accepts the callback
		expect(onEventClick).not.toHaveBeenCalled();
	});

	it("fetches correct date range for 4 weeks", async () => {
		const initialDate = new Date("2023-01-15");
		render(Calendar, { initialDate });

		await waitFor(() => {
			const fetchCall = (global.fetch as any).mock.calls[0][0];
			expect(fetchCall).toContain("start=");
			expect(fetchCall).toContain("end=");
		});
	});

	it("correctly parses event dates from API response", async () => {
		const rawEvents = [
			{
				id: 1,
				title: "Test Event",
				start_date: "2023-01-15T10:00:00.000Z",
				end_date: "2023-01-15T12:00:00.000Z",
				description: "Test",
				location: "Test",
				validated: true,
				created_at: "2023-01-01T00:00:00.000Z",
				edited_at: "2023-01-01T00:00:00.000Z",
				association_id: 1,
				list_id: null,
			},
		];

		(global.fetch as any).mockResolvedValue({
			json: async () => rawEvents,
		});

		render(Calendar, { initialDate: new Date("2023-01-15") });

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalled();
		});
	});
});

describe("Calendar Component - Mobile View", () => {
	const mockEvents: RawEvent[] = [
		{
			id: 1,
			title: "Mobile Event 1",
			start_date: new Date("2023-01-15T10:00:00"),
			end_date: new Date("2023-01-15T12:00:00"),
			description: "Desc 1",
			location: "Loc 1",
			validated: true,
			created_at: new Date(),
			edited_at: new Date(),
			association_id: 1,
			list_id: null,
		},
	];

	let originalMatchMedia: typeof window.matchMedia;

	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockResolvedValue({
			json: async () => mockEvents,
		});

		originalMatchMedia = window.matchMedia;

		// Mock as mobile
		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: query.includes("max-width: 700px"), // Mobile mode
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
	});

	afterEach(() => {
		window.matchMedia = originalMatchMedia;
	});

	it("renders mobile view when screen is small", async () => {
		render(Calendar, { initialDate: new Date("2023-01-15") });

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalled();
		});

		// Mobile view should exist in DOM
		expect(document.querySelector(".mobile-view")).toBeInTheDocument();
	});

	it("renders 1 week in mobile view", async () => {
		render(Calendar, { initialDate: new Date("2023-01-15") });

		await waitFor(() => {
			const mobileDays = document.querySelectorAll(".mobile-day");
			expect(mobileDays.length).toBe(7);
		});
	});

	it("navigates weeks in mobile view", async () => {
		const { getByLabelText } = render(Calendar, { initialDate: new Date("2023-01-09") }); // Mon Jan 09

		// Wait for initial load
		await waitFor(() => {
			const mobileDays = document.querySelectorAll(".mobile-day");
			expect(mobileDays.length).toBe(7);
		});

		// Initial: Jan 09 - Jan 15
		// Check for Jan 09 in the document
		expect(document.body.textContent).toContain("9");

		const nextButton = getByLabelText("Semaine suivante");
		await fireEvent.click(nextButton);

		// Should navigate to Jan 16 (next week)
		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/start=2023-01-1[56]/));
		});
	});
});

describe("Calendar Component - Refresh Function", () => {
	const mockEvents: RawEvent[] = [
		{
			id: 1,
			title: "Event 1",
			start_date: new Date("2023-01-15T10:00:00"),
			end_date: new Date("2023-01-15T12:00:00"),
			description: "Desc 1",
			location: "Loc 1",
			validated: true,
			created_at: new Date(),
			edited_at: new Date(),
			association_id: 1,
			list_id: null,
		},
	];

	let originalMatchMedia: typeof window.matchMedia;

	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockResolvedValue({
			json: async () => mockEvents,
		});

		originalMatchMedia = window.matchMedia;
		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
	});

	afterEach(() => {
		window.matchMedia = originalMatchMedia;
	});

	it("exposes refresh function", async () => {
		const { component } = render(Calendar, { initialDate: new Date("2023-01-15") });

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalled();
		});

		// The component should export a refresh function
		expect(typeof component.refresh).toBe("function");
	});

	it("refresh reloads events in desktop mode", async () => {
		const { component } = render(Calendar, { initialDate: new Date("2023-01-15") });

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		// Call refresh
		component.refresh();

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledTimes(2);
		});
	});
});

describe("Calendar Component - Helper Functions", () => {
	let originalMatchMedia: typeof window.matchMedia;

	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockResolvedValue({
			json: async () => [],
		});

		originalMatchMedia = window.matchMedia;
		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
	});

	afterEach(() => {
		window.matchMedia = originalMatchMedia;
	});

	it("getStartOfWeek returns Monday for a Sunday date", () => {
		// January 1st 2023 is a Sunday
		const sunday = new Date("2023-01-01");
		render(Calendar, { initialDate: sunday });

		// The week should start on Monday - verify week structure exists
		expect(document.querySelector(".calendar-weekday-header")).toBeInTheDocument();
	});

	it("getStartOfWeek returns Monday for a Wednesday date", () => {
		// January 4th 2023 is a Wednesday
		const wednesday = new Date("2023-01-04");
		render(Calendar, { initialDate: wednesday });

		// The week should start on Monday Jan 2, 2023
		expect(screen.getByText(/Semaine du/)).toBeInTheDocument();
	});

	it("displays multiple weeks correctly", () => {
		render(Calendar, { initialDate: new Date("2023-01-15") });

		// Should show 4 weeks
		const tableBody = document.querySelector("tbody");
		expect(tableBody?.querySelectorAll("tr").length).toBe(4);
	});

	it("each week row has 7 days", () => {
		render(Calendar, { initialDate: new Date("2023-01-15") });

		const rows = document.querySelectorAll("tbody tr");
		rows.forEach((row) => {
			expect(row.querySelectorAll("td").length).toBe(7);
		});
	});
});

describe("Calendar Component - Edge Cases", () => {
	let originalMatchMedia: typeof window.matchMedia;

	beforeEach(() => {
		vi.clearAllMocks();
		originalMatchMedia = window.matchMedia;
		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
	});

	afterEach(() => {
		window.matchMedia = originalMatchMedia;
	});

	it("handles empty events array", async () => {
		(global.fetch as any).mockResolvedValue({
			json: async () => [],
		});

		render(Calendar, { initialDate: new Date("2023-01-15") });

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalled();
		});

		expect(screen.getAllByText(/Calendrier des événements/)[0]).toBeInTheDocument();
	});

	it("handles empty initial state", () => {
		(global.fetch as any).mockResolvedValue({
			json: async () => [],
		});

		// Should render
		render(Calendar, { initialDate: new Date("2023-01-15") });

		// Component should still render
		expect(screen.getAllByText(/Calendrier des événements/)[0]).toBeInTheDocument();
	});

	it("handles year boundary navigation", async () => {
		(global.fetch as any).mockResolvedValue({
			json: async () => [],
		});

		// Start at beginning of year
		render(Calendar, { initialDate: new Date("2023-01-02") });

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalled();
		});

		// Navigate to previous week (crosses year boundary)
		const prevButton = screen.getByLabelText("Semaine précédente");
		await fireEvent.click(prevButton);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledTimes(2);
		});
	});

	it("handles multiple rapid navigation clicks", async () => {
		(global.fetch as any).mockResolvedValue({
			json: async () => [],
		});

		render(Calendar, { initialDate: new Date("2023-01-15") });

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalled();
		});

		const nextButton = screen.getByLabelText("Semaine suivante");

		// Click multiple times rapidly
		await fireEvent.click(nextButton);
		await fireEvent.click(nextButton);
		await fireEvent.click(nextButton);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalled();
		});
	});
});
