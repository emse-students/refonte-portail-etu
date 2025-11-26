import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Calendar from "$lib/components/calendar/Calendar.svelte";
import type { RawEvent } from "$lib/databasetypes";

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

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
	];

	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockResolvedValue({
			json: async () => mockEvents,
		});
	});

	it("renders calendar title with current week", () => {
		const initialDate = new Date("2023-01-01");
		render(Calendar, { initialDate });

		// Week of Jan 1st 2023 starts on Dec 26th 2022 (Monday)
		// Or depending on getStartOfWeek implementation.
		// The component uses getStartOfWeek which goes back to Monday.
		// Jan 1st 2023 is a Sunday. So previous Monday is Dec 26th 2022.

		expect(screen.getByText(/Calendrier des événements/i)).toBeInTheDocument();
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
});
