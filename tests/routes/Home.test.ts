import { render, screen } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "../../src/routes/+page.svelte";
import Permission from "../../src/lib/permissions";
import CalendarMock from "../mocks/CalendarMock.svelte";

// Mock $app/state
vi.mock("$app/state", () => ({
	page: {
		data: {
			session: null,
			userData: null,
			eventSubmissionOpen: true,
		},
	},
}));

// Mock Calendar component
vi.mock("../../src/lib/components/calendar/Calendar.svelte", async () => {
	const CalendarMock = await import("../mocks/CalendarMock.svelte");
	return {
		default: CalendarMock.default,
	};
});

describe("Home Page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders welcome message for guest", async () => {
		// Mock page data for guest
		const { page } = await import("$app/state");
		page.data = {
			session: null,
			userData: null,
			eventSubmissionOpen: true,
		} as any;

		render(HomePage);
		expect(screen.getByText("Bienvenue dans le portail étudiant !")).toBeInTheDocument();
		expect(screen.getByTestId("calendar-mock")).toBeInTheDocument();
	});

	it("renders welcome message for logged in user", async () => {
		// Mock page data for user
		const { page } = await import("$app/state");
		page.data = {
			session: { user: { name: "John Doe" } },
			userData: { permissions: 0, memberships: [] },
			eventSubmissionOpen: true,
		} as any;

		render(HomePage);
		expect(screen.getByText("Bienvenue John Doe !")).toBeInTheDocument();
	});

	it("hides event proposal button for guest", async () => {
		const { page } = await import("$app/state");
		page.data = {
			session: null,
			userData: null,
			eventSubmissionOpen: true,
		} as any;

		render(HomePage);
		expect(screen.queryByText("Gestion d'événements")).not.toBeInTheDocument();
	});

	it("shows event proposal button for user with global permission", async () => {
		const { page } = await import("$app/state");
		page.data = {
			session: { user: { name: "Admin" } },
			userData: { permissions: Permission.EVENTS, memberships: [] },
			eventSubmissionOpen: true,
		} as any;

		render(HomePage);
		expect(screen.getByText("Gestion d'événements")).toBeInTheDocument();
	});

	it("shows event proposal button for user with association permission", async () => {
		const { page } = await import("$app/state");
		page.data = {
			session: { user: { name: "Assoc Member" } },
			userData: {
				permissions: 0,
				memberships: [{ role: { permissions: Permission.EVENTS } }],
			},
			eventSubmissionOpen: true,
		} as any;

		render(HomePage);
		expect(screen.getByText("Gestion d'événements")).toBeInTheDocument();
	});

	it("hides event proposal button for user without permission", async () => {
		const { page } = await import("$app/state");
		page.data = {
			session: { user: { name: "User" } },
			userData: { permissions: 0, memberships: [] },
			eventSubmissionOpen: true,
		} as any;

		render(HomePage);
		expect(screen.queryByText("Gestion d'événements")).not.toBeInTheDocument();
	});
});
