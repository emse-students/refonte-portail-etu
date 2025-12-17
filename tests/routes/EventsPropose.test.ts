import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EventsProposePage from "../../src/routes/events/propose/+page.svelte";
import Permission from "../../src/lib/permissions";

// Mock components
vi.mock("../../src/lib/components/calendar/Calendar.svelte", async () => {
	const CalendarMock = await import("../mocks/CalendarMock.svelte");
	return { default: CalendarMock.default };
});

vi.mock("../../src/lib/components/EventForm.svelte", async () => {
	const EventFormMock = await import("../mocks/EventFormMock.svelte");
	return { default: EventFormMock.default };
});

vi.mock("../../src/lib/components/Modal.svelte", async () => {
	const ModalMock = await import("../mocks/ModalMock.svelte");
	return { default: ModalMock.default };
});

// Mock $app/state
vi.mock("$app/state", () => ({
	page: {
		data: {
			userData: {
				permissions: 0,
				memberships: [],
			},
		},
	},
}));

describe("Events Propose Page", () => {
	const mockData = {
		associations: [],
		lists: [],
		isOpen: true,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Reset page mock if needed, but here we might need to override it per test
	});

	it("renders page title", () => {
		render(EventsProposePage, { data: mockData } as any);
		expect(screen.getByRole("heading", { name: "Gestion des événements" })).toBeInTheDocument();
	});

	it("renders calendar", () => {
		render(EventsProposePage, { data: mockData } as any);
		expect(screen.getByTestId("calendar-mock")).toBeInTheDocument();
	});

	it("shows info modal if no associations/lists when clicking propose button", async () => {
		render(EventsProposePage, { data: mockData } as any);

		const proposeBtn = screen.getByText("Proposer un événement", { selector: "button" });
		await fireEvent.click(proposeBtn);

		expect(screen.getByText("Information")).toBeInTheDocument();
		expect(screen.getByText(/Vous n'avez aucune association/)).toBeInTheDocument();
	});

	// TODO: Add more tests for permissions and interactions
});
