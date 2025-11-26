import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Event from "$lib/components/calendar/Event.svelte";
import type { RawEvent } from "$lib/databasetypes";

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

describe("Event Component", () => {
	const mockEvent: RawEvent = {
		id: 1,
		title: "Test Event",
		start_date: new Date("2023-01-01T10:00:00"),
		end_date: new Date("2023-01-01T12:00:00"),
		description: "Test Description",
		location: "Test Location",
		validated: true,
		created_at: new Date(),
		edited_at: new Date(),
		association_id: 1,
		list_id: null,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockResolvedValue({
			json: async () => ({ name: "Test Asso", handle: "test-asso" }),
		});
	});

	it("renders event title", () => {
		render(Event, { ...mockEvent });
		expect(screen.getByText("Test Event")).toBeInTheDocument();
	});

	it("fetches association details if association_id is present", async () => {
		render(Event, { ...mockEvent });

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/associations/1"));
		});
	});

	it("opens modal on click", async () => {
		render(Event, { ...mockEvent });

		const eventElements = screen.getAllByText("Test Event");
		await fireEvent.click(eventElements[0]);

		// Modal should be open
		expect(screen.getByText("Test Description")).toBeInTheDocument();
		expect(screen.getByText("Test Location")).toBeInTheDocument();
	});

	it("calls onEventClick if provided", async () => {
		const onEventClick = vi.fn();
		render(Event, { ...mockEvent, onEventClick });

		const eventElement = screen.getByText("Test Event");
		await fireEvent.click(eventElement);

		expect(onEventClick).toHaveBeenCalled();
	});

	it("does not open modal if onEventClick returns true", async () => {
		const onEventClick = vi.fn().mockReturnValue(true);
		render(Event, { ...mockEvent, onEventClick });

		const eventElement = screen.getByText("Test Event");
		await fireEvent.click(eventElement);

		expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
	});
});
