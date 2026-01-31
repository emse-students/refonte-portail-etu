import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Event from "$lib/components/calendar/Event.svelte";
import type { RawEvent, FullUser } from "$lib/databasetypes";
import Permission from "$lib/permissions";

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

describe("Event Duplicate Feature", () => {
	// Mock window.location
	const originalLocation = window.location;

	beforeEach(() => {
		vi.clearAllMocks();
		// @ts-ignore
		delete window.location;
		// @ts-ignore
		window.location = { href: "" };

		(global.fetch as any).mockResolvedValue({
			json: async () => ({ name: "Test Asso", handle: "test-asso" }),
		});
	});

	afterEach(() => {
		// @ts-ignore - Cleaning up the mock
		window.location = originalLocation;
	});

	const mockEvent: RawEvent = {
		id: 1,
		title: "To Duplicate",
		start_date: new Date("2023-01-01T10:00:00"),
		end_date: new Date("2023-01-01T12:00:00"),
		description: "Desc",
		location: "Loc",
		validated: true,
		created_at: new Date(),
		edited_at: new Date(),
		association_id: 123,
		list_id: null,
	};

	const mockAdminUser: FullUser = {
		id: 1,
		first_name: "Admin",
		last_name: "User",
		email: "admin@example.com",
		login: "admin",
		promo: 2023,
		admin: true,
		permissions: Permission.MANAGE,
		memberships: [],
	};

	const mockStandardUser: FullUser = {
		id: 2,
		first_name: "Standard",
		last_name: "User",
		email: "standard@example.com",
		login: "standard",
		promo: 2023,
		admin: false,
		permissions: Permission.MEMBER,
		memberships: [],
	};

	it("shows duplicate button for admin user", async () => {
		render(Event, { ...mockEvent, user: mockAdminUser });

		// Open modal
		const eventEl = screen.getByText("To Duplicate");
		await fireEvent.click(eventEl);

		// Check button exists
		expect(screen.getByTitle("Dupliquer l'événement")).toBeInTheDocument();
	});

	it("does NOT show duplicate button for standard user without membership", async () => {
		render(Event, { ...mockEvent, user: mockStandardUser });

		// Open modal
		const eventEl = screen.getByText("To Duplicate");
		await fireEvent.click(eventEl);

		// Check button does NOT exist
		expect(screen.queryByTitle("Dupliquer l'événement")).not.toBeInTheDocument();
	});

	it("shows duplicate button for user with association membership", async () => {
		const memberUser: FullUser = {
			...mockStandardUser,
			memberships: [
				{
					id: 1,
					user: mockStandardUser,
					role_name: "Prez",
					permissions: Permission.MANAGE,
					hierarchy: 1,
					association_id: 123,
					list_id: null,
					visible: true,
				},
			],
		};

		render(Event, { ...mockEvent, user: memberUser });

		// Open modal
		const eventEl = screen.getByText("To Duplicate");
		await fireEvent.click(eventEl);

		// Check button exists
		expect(screen.getByTitle("Dupliquer l'événement")).toBeInTheDocument();
	});
});
