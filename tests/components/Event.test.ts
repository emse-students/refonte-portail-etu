import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Event from "$lib/components/calendar/Event.svelte";
import type { RawEvent } from "$lib/databasetypes";

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

describe("Event Component", () => {
	const mockEventAsso: RawEvent = {
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

	const mockEventList: RawEvent = {
		id: 2,
		title: "Test Event List",
		start_date: new Date("2023-01-02T10:00:00"),
		end_date: new Date("2023-01-02T12:00:00"),
		description: "Test Description List",
		location: "Test Location List",
		validated: true,
		created_at: new Date(),
		edited_at: new Date(),
		association_id: null,
		list_id: 1,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockResolvedValue({
			json: async () => ({ name: "Test Asso", handle: "test-asso" }),
		});
	});

	it("renders event title", () => {
		render(Event, { ...mockEventAsso });
		expect(screen.getByText("Test Event")).toBeInTheDocument();
	});

	it("fetches association details if association_id is present", async () => {
		render(Event, { ...mockEventAsso });

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/associations/1"));
		});
	});

	it("fetches list details if list_id is present", async () => {
		render(Event, { ...mockEventList });

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/lists/1"));
		});
	});

	it("opens modal on click", async () => {
		render(Event, { ...mockEventAsso });

		const eventElements = screen.getAllByText("Test Event");
		await fireEvent.click(eventElements[0]);

		// Modal should be open
		expect(screen.getByText("Test Description")).toBeInTheDocument();
		expect(screen.getByText("Test Location")).toBeInTheDocument();
	});

	it("calls onEventClick if provided", async () => {
		const onEventClick = vi.fn();
		render(Event, { ...mockEventAsso, onEventClick });

		const eventElement = screen.getByText("Test Event");
		await fireEvent.click(eventElement);

		expect(onEventClick).toHaveBeenCalled();
	});

	it("does not open modal if onEventClick returns true", async () => {
		const onEventClick = vi.fn().mockReturnValue(true);
		render(Event, { ...mockEventAsso, onEventClick });

		const eventElement = screen.getByText("Test Event");
		await fireEvent.click(eventElement);

		expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
	});
	it("ensure modal closes correctly", async () => {
		render(Event, { ...mockEventAsso });

		const eventElements = screen.getAllByText("Test Event");
		await fireEvent.click(eventElements[0]);

		// Modal should be open
		expect(screen.getByText("Test Description")).toBeInTheDocument();

		const closeButton = screen.getByLabelText("Fermer");
		await fireEvent.click(closeButton);

		await waitFor(() => {
			expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
		});
	});

	it("ensure modal closes on when going back in history", async () => {
		render(Event, { ...mockEventAsso });

		const eventElements = screen.getAllByText("Test Event");
		await fireEvent.click(eventElements[0]);

		// Modal should be open
		expect(screen.getByText("Test Description")).toBeInTheDocument();

		// Simulate popping history state
		window.dispatchEvent(new PopStateEvent("popstate"));

		await waitFor(() => {
			expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
		});
	});

	it("modal contains Association or List accordingly", async () => {
		// Association event
		render(Event, { ...mockEventAsso });

		const eventElementsAsso = screen.getAllByText("Test Event");
		await fireEvent.click(eventElementsAsso[0]);

		expect(screen.getByText("Association :")).toBeInTheDocument();
		expect(screen.getByText("Association :").tagName).toBe("STRONG");

		// Close modal
		const closeButtonAsso = screen.getByLabelText("Fermer");
		await fireEvent.click(closeButtonAsso);

		// List event
		render(Event, { ...mockEventList });

		const eventElementsList = screen.getAllByText("Test Event List");
		await fireEvent.click(eventElementsList[0]);

		expect(screen.getByText("Liste :")).toBeInTheDocument();
		expect(screen.getByText("Liste :").tagName).toBe("STRONG");

		// Close modal
		const closeButtonList = screen.getByLabelText("Fermer");
		await fireEvent.click(closeButtonList);
	});
});
