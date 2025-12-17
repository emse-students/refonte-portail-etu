import { render, screen } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import EventCard from "../../src/lib/components/EventCard.svelte";
import type { RawEvent } from "../../src/lib/databasetypes";

describe("EventCard Component", () => {
	const baseEvent: RawEvent = {
		id: 1,
		association_id: 1,
		list_id: null,
		title: "Super Event",
		description: "This is a great event",
		start_date: new Date("2024-06-01T10:00:00"),
		end_date: new Date("2024-06-01T12:00:00"),
		location: "Room 101",
		validated: true,
		created_at: new Date(),
		edited_at: new Date(),
	};

	it("should render event title and description", () => {
		render(EventCard, { event: baseEvent });
		expect(screen.getByText("Super Event")).toBeInTheDocument();
		expect(screen.getByText("This is a great event")).toBeInTheDocument();
	});

	it("should render location when present", () => {
		render(EventCard, { event: baseEvent });
		expect(screen.getByText("Room 101")).toBeInTheDocument();
	});

	it("should not render location when missing", () => {
		const eventNoLoc = { ...baseEvent, location: "" };
		render(EventCard, { event: eventNoLoc });
		expect(screen.queryByText("Room 101")).not.toBeInTheDocument();
	});

	it("should format date correctly for same-day event", () => {
		render(EventCard, { event: baseEvent });
		// Date: 1 juin 2024
		// Time: 10:00 - 12:00
		// The text is now split across <time> tags, so we check for parts
		expect(screen.getByText(/1 juin 2024/)).toBeInTheDocument();
		expect(screen.getByText("10:00")).toBeInTheDocument();
		expect(screen.getByText("12:00")).toBeInTheDocument();
	});

	it("should format date correctly for multi-day event", () => {
		const multiDayEvent = {
			...baseEvent,
			start_date: new Date("2024-06-01T10:00:00"),
			end_date: new Date("2024-06-03T18:00:00"),
		};
		render(EventCard, { event: multiDayEvent });
		// Text is split: "Du " <time>... " au " <time>...
		expect(screen.getByText(/Du/)).toBeInTheDocument();
		expect(screen.getByText(/1 juin 2024/)).toBeInTheDocument();
		expect(screen.getByText(/au/)).toBeInTheDocument();
		expect(screen.getByText(/3 juin 2024/)).toBeInTheDocument();
	});
});
