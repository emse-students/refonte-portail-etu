import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CalendarDay from "$lib/components/calendar/CalendarDay.svelte";
import type { RawEvent } from "$lib/databasetypes";

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

describe("CalendarDay Component", () => {
	const mockDate = new Date("2023-01-01T10:00:00");
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
			start_date: new Date("2023-01-01T14:00:00"),
			end_date: new Date("2023-01-01T16:00:00"),
			description: "Desc 2",
			location: "Loc 2",
			validated: true,
			created_at: new Date(),
			edited_at: new Date(),
			association_id: 1,
			list_id: null,
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockResolvedValue({
			json: async () => ({ name: "Test Asso", handle: "test-asso" }),
		});
	});

	it("renders day number and month", () => {
		render(CalendarDay, { props: { dayDate: mockDate, events: [] } });

		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("janv.")).toBeInTheDocument();
	});

	it("renders events for the day", () => {
		render(CalendarDay, { props: { dayDate: mockDate, events: mockEvents } });

		expect(screen.getByText("Event 1")).toBeInTheDocument();
		expect(screen.getByText("Event 2")).toBeInTheDocument();
	});

	it("shows overflow indicator if more than 3 events", () => {
		const manyEvents = [
			...mockEvents,
			{ ...mockEvents[0], id: 3, title: "Event 3" },
			{ ...mockEvents[0], id: 4, title: "Event 4" },
		];

		render(CalendarDay, { props: { dayDate: mockDate, events: manyEvents } });

		expect(screen.getByText("+1 autres")).toBeInTheDocument();
	});

	it("calls onAddEvent when add button is clicked", async () => {
		const onAddEvent = vi.fn();
		render(CalendarDay, { props: { dayDate: mockDate, events: [], onAddEvent } });

		const addButton = screen.getByLabelText("Ajouter un événement");
		await fireEvent.click(addButton);

		expect(onAddEvent).toHaveBeenCalled();
	});

	it("does not render add button if onAddEvent is not provided", () => {
		render(CalendarDay, { props: { dayDate: mockDate, events: [] } });

		const addButton = screen.queryByLabelText("Ajouter un événement");
		expect(addButton).not.toBeInTheDocument();
	});
});
