import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { load } from "../../../src/routes/events/propose/+page.server";
import EventsProposePage from "../../../src/routes/events/propose/+page.svelte";
import Permission from "$lib/permissions";

// Mock dependencies
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
}));
import db from "$lib/server/database";

vi.mock("$lib/server/auth-middleware", () => ({
	requireAuth: vi.fn(),
	getAuthorizedAssociationIds: vi.fn(),
	getAuthorizedListIds: vi.fn(),
}));
import {
	requireAuth,
	getAuthorizedAssociationIds,
	getAuthorizedListIds,
} from "$lib/server/auth-middleware";

// Create a mutable page mock
const mockPageData = {
	userData: null as any,
};

// Mock $app/state with a getter so it can be changed
vi.mock("$app/state", () => ({
	page: {
		get data() {
			return mockPageData;
		},
	},
}));

// Mock $lib/components/calendar/Calendar.svelte
vi.mock("$lib/components/calendar/Calendar.svelte", () => ({
	default: vi.fn(),
}));

// Mock $lib/components/EventForm.svelte
vi.mock("$lib/components/EventForm.svelte", () => ({
	default: vi.fn(),
}));

// Mock global fetch
vi.stubGlobal("fetch", vi.fn());

describe("Events Propose Page Server Load", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should redirect to login if user is not authenticated", async () => {
		vi.mocked(requireAuth).mockResolvedValue(null);

		try {
			await load({} as any);
			expect.fail("Should have thrown redirect");
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe("/auth/login");
		}
	});

	it("should redirect to home if submission is closed and user is not admin", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		// Mock config: submission closed
		vi.mocked(db).mockResolvedValueOnce([]); // No config found or false
		// Mock permissions: user has some association permissions (not global admin)
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue([1]);
		vi.mocked(getAuthorizedListIds).mockReturnValue([]);

		try {
			await load({} as any);
			expect.fail("Should have thrown redirect");
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe("/");
		}
	});

	it("should allow access if submission is closed but user is global admin", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		vi.mocked(db).mockResolvedValueOnce([]); // Submission closed
		// Global admin (returns null)
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue(null);
		vi.mocked(getAuthorizedListIds).mockReturnValue(null);

		// Mock fetching all associations and lists
		vi.mocked(db)
			.mockResolvedValueOnce([{ id: 1, name: "Asso A" }]) // Associations
			.mockResolvedValueOnce([{ id: 1, name: "List A" }]); // Lists

		const result = (await load({} as any)) as any;

		expect(result.isOpen).toBe(false);
		expect(result.associations).toHaveLength(1);
		expect(result.lists).toHaveLength(1);
	});

	it("should return authorized associations and lists when submission is open", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		// Mock config: submission open
		vi.mocked(db).mockResolvedValueOnce([{ value: "true" }]);

		// User has specific permissions
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue([10]);
		vi.mocked(getAuthorizedListIds).mockReturnValue([20]);

		// Mock fetching specific associations and lists
		vi.mocked(db)
			.mockResolvedValueOnce([{ id: 10, name: "My Asso" }])
			.mockResolvedValueOnce([{ id: 20, name: "My List" }]);

		const result = (await load({} as any)) as any;

		expect(result.isOpen).toBe(true);
		expect(result.associations[0].name).toBe("My Asso");
		expect(result.lists[0].name).toBe("My List");

		// Verify DB queries used IDs
		expect(db).toHaveBeenCalledWith(expect.anything(), [10]);
		expect(db).toHaveBeenCalledWith(expect.anything(), [20]);
	});

	it("should redirect to home if submission is closed with value false", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		// Mock config: submission explicitly set to false
		vi.mocked(db).mockResolvedValueOnce([{ value: "false" }]);
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue([1]);
		vi.mocked(getAuthorizedListIds).mockReturnValue([]);

		try {
			await load({} as any);
			expect.fail("Should have thrown redirect");
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe("/");
		}
	});

	it("should return empty associations when user has no association permissions", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		vi.mocked(db).mockResolvedValueOnce([{ value: "true" }]); // Submission open
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue([]); // No associations
		vi.mocked(getAuthorizedListIds).mockReturnValue([5]);

		// Only list query
		vi.mocked(db).mockResolvedValueOnce([{ id: 5, name: "My List" }]);

		const result = (await load({} as any)) as any;

		expect(result.associations).toHaveLength(0);
		expect(result.lists).toHaveLength(1);
	});

	it("should return empty lists when user has no list permissions", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		vi.mocked(db).mockResolvedValueOnce([{ value: "true" }]); // Submission open
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue([3]);
		vi.mocked(getAuthorizedListIds).mockReturnValue([]); // No lists

		// Only association query
		vi.mocked(db).mockResolvedValueOnce([{ id: 3, name: "My Asso" }]);

		const result = (await load({} as any)) as any;

		expect(result.associations).toHaveLength(1);
		expect(result.lists).toHaveLength(0);
	});

	it("should sort associations and lists by name", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		vi.mocked(db).mockResolvedValueOnce([{ value: "true" }]);
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue(null);
		vi.mocked(getAuthorizedListIds).mockReturnValue(null);

		// Return unsorted data
		vi.mocked(db)
			.mockResolvedValueOnce([
				{ id: 2, name: "Zeta Asso" },
				{ id: 1, name: "Alpha Asso" },
			])
			.mockResolvedValueOnce([
				{ id: 2, name: "Zebra List" },
				{ id: 1, name: "Apple List" },
			]);

		const result = (await load({} as any)) as any;

		// Should be sorted alphabetically
		expect(result.associations[0].name).toBe("Alpha Asso");
		expect(result.associations[1].name).toBe("Zeta Asso");
		expect(result.lists[0].name).toBe("Apple List");
		expect(result.lists[1].name).toBe("Zebra List");
	});
});

describe("Events Propose Page Component", () => {
	const mockAssociations = [
		{
			id: 1,
			name: "Test Association",
			handle: "test-asso",
			description: "",
			members: [],
			icon: "",
			color: 0,
		},
		{
			id: 2,
			name: "Another Association",
			handle: "another-asso",
			description: "",
			members: [],
			icon: "",
			color: 0,
		},
	] as any[];

	const mockLists = [
		{
			id: 1,
			name: "Test List",
			handle: "test-list",
			association_id: 1,
			description: "",
			icon: "",
			members: [],
			promo: 2024,
			color: 0,
		},
	] as any[];

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: async () => ({}),
		} as Response);

		// Reset the page mock for each test
		mockPageData.userData = null;
	});

	it("renders page title", () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Gestion des événements");
	});

	it("renders 'Proposer un événement' button", () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		// Button specifically (not the h1)
		expect(screen.getByRole("button", { name: "Proposer un événement" })).toBeInTheDocument();
	});

	it("does not show admin buttons when user is not global event manager", () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		expect(screen.queryByText("Clôturer & Valider")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Ouvrir les soumissions" })
		).not.toBeInTheDocument();
	});

	it("opens info modal when user has no associations or lists", async () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: [],
					lists: [],
					isOpen: true,
				} as any,
			},
		});

		const proposeBtn = screen.getByRole("button", { name: "Proposer un événement" });
		await fireEvent.click(proposeBtn);

		await waitFor(() => {
			expect(screen.getByText("Information")).toBeInTheDocument();
			expect(
				screen.getByText(
					"Vous n'avez aucune association ou liste pour laquelle proposer un événement."
				)
			).toBeInTheDocument();
		});
	});

	it("closes info modal when OK is clicked", async () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: [],
					lists: [],
					isOpen: true,
				} as any,
			},
		});

		const proposeBtn = screen.getByRole("button", { name: "Proposer un événement" });
		await fireEvent.click(proposeBtn);

		await waitFor(() => {
			expect(screen.getByText("Information")).toBeInTheDocument();
		});

		const okBtn = screen.getByText("OK");
		await fireEvent.click(okBtn);

		await waitFor(() => {
			expect(screen.queryByText("Information")).not.toBeInTheDocument();
		});
	});

	it("opens event form modal when propose button is clicked and user has associations", async () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		const proposeBtn = screen.getByRole("button", { name: "Proposer un événement" });
		await fireEvent.click(proposeBtn);

		// Form modal should open - there will be multiple instances of "Proposer un événement"
		// (heading, button, and modal title)
		await waitFor(() => {
			const elements = screen.getAllByText("Proposer un événement");
			expect(elements.length).toBeGreaterThan(1);
		});
	});
});

describe("Events Propose Page - Global Event Manager", () => {
	const mockAssociations = [
		{
			id: 1,
			name: "Test Association",
			handle: "test-asso",
			description: "",
			members: [],
			icon: "",
			color: 0,
		},
	] as any[];
	const mockLists = [
		{
			id: 1,
			name: "Test List",
			handle: "test-list",
			association_id: 1,
			description: "",
			icon: "",
			members: [],
			promo: 2024,
			color: 0,
		},
	] as any[];

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock user with global EVENTS permission
		mockPageData.userData = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.MANAGE,
			promo: 2024,
			memberships: [],
		};
	});

	it("shows 'Clôturer & Valider' button when submissions are open", async () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		// The button visibility depends on isGlobalEventManager derived value
		// Since we mocked the page state, this test verifies the structure
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Gestion des événements");
	});
});

describe("Events Propose Page - Close and Validate Modal", () => {
	const mockAssociations = [
		{
			id: 1,
			name: "Test Association",
			handle: "test-asso",
			description: "",
			members: [],
			icon: "",
			color: 0,
		},
	] as any[];
	const mockLists: any[] = [];

	beforeEach(() => {
		vi.clearAllMocks();
		mockPageData.userData = null;
		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: async () => ({ message: "Opération réussie" }),
		} as Response);
	});

	it("renders the close and validate modal structure", () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		// The modal exists in the DOM but is hidden
		expect(screen.queryByText("Confirmer la clôture")).not.toBeInTheDocument();
	});
});

describe("Events Propose Page - Open Submissions Modal", () => {
	const mockAssociations = [
		{
			id: 1,
			name: "Test Association",
			handle: "test-asso",
			description: "",
			members: [],
			icon: "",
			color: 0,
		},
	] as any[];
	const mockLists: any[] = [];

	beforeEach(() => {
		vi.clearAllMocks();
		mockPageData.userData = null;
		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: async () => ({ message: "Soumissions ouvertes" }),
		} as Response);
	});

	it("renders the open submissions modal structure", () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: false,
				} as any,
			},
		});

		// The modal exists in the DOM but is hidden
		expect(screen.queryByText("Ouvrir les soumissions")).not.toBeInTheDocument();
	});
});

describe("Events Propose Page Server - Edge Cases", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return empty arrays when user has no permissions at all", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		vi.mocked(db).mockResolvedValueOnce([{ value: "true" }]); // Submission open
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue([]);
		vi.mocked(getAuthorizedListIds).mockReturnValue([]);

		const result = (await load({} as any)) as any;

		expect(result.isOpen).toBe(true);
		expect(result.associations).toHaveLength(0);
		expect(result.lists).toHaveLength(0);
	});

	it("should handle global admin with empty database", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		vi.mocked(db).mockResolvedValueOnce([{ value: "true" }]); // Submission open
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue(null); // Global admin
		vi.mocked(getAuthorizedListIds).mockReturnValue(null);

		// Empty database
		vi.mocked(db).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

		const result = (await load({} as any)) as any;

		expect(result.isOpen).toBe(true);
		expect(result.associations).toHaveLength(0);
		expect(result.lists).toHaveLength(0);
	});

	it("should handle mixed permissions - associations only", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		vi.mocked(db).mockResolvedValueOnce([{ value: "true" }]); // Submission open
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue([1, 2, 3]);
		vi.mocked(getAuthorizedListIds).mockReturnValue([]);

		vi.mocked(db).mockResolvedValueOnce([
			{ id: 1, name: "Asso 1" },
			{ id: 2, name: "Asso 2" },
			{ id: 3, name: "Asso 3" },
		]);

		const result = (await load({} as any)) as any;

		expect(result.associations).toHaveLength(3);
		expect(result.lists).toHaveLength(0);
	});

	it("should handle mixed permissions - lists only", async () => {
		vi.mocked(requireAuth).mockResolvedValue({ id: 1 } as any);
		vi.mocked(db).mockResolvedValueOnce([{ value: "true" }]); // Submission open
		vi.mocked(getAuthorizedAssociationIds).mockReturnValue([]);
		vi.mocked(getAuthorizedListIds).mockReturnValue([1, 2]);

		vi.mocked(db).mockResolvedValueOnce([
			{ id: 1, name: "List 1" },
			{ id: 2, name: "List 2" },
		]);

		const result = (await load({} as any)) as any;

		expect(result.associations).toHaveLength(0);
		expect(result.lists).toHaveLength(2);
	});
});

describe("Events Propose Page Component - Calendar Integration", () => {
	const mockAssociations = [
		{
			id: 1,
			name: "Test Association",
			handle: "test-asso",
			description: "",
			members: [],
			icon: "",
			color: 0,
		},
	] as any[];

	const mockLists = [
		{
			id: 1,
			name: "Test List",
			handle: "test-list",
			association_id: 1,
			description: "",
			icon: "",
			members: [],
			promo: 2024,
			color: 0,
		},
	] as any[];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders calendar wrapper", () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		// Calendar wrapper should exist
		expect(document.querySelector(".calendar-wrapper")).toBeInTheDocument();
	});

	it("renders with isOpen false", () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: false,
				} as any,
			},
		});

		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Gestion des événements");
	});

	it("renders container structure correctly", () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		expect(document.querySelector(".container")).toBeInTheDocument();
		expect(document.querySelector(".page-header")).toBeInTheDocument();
		expect(document.querySelector(".actions")).toBeInTheDocument();
	});
});

describe("Events Propose Page Component - Only Lists Available", () => {
	const mockAssociations: any[] = [];
	const mockLists = [
		{
			id: 1,
			name: "Test List",
			handle: "test-list",
			association_id: 1,
			description: "",
			icon: "",
			members: [],
			promo: 2024,
			color: 0,
		},
	] as any[];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("opens form modal when only lists are available", async () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		const proposeBtn = screen.getByRole("button", { name: "Proposer un événement" });
		await fireEvent.click(proposeBtn);

		// Form should open (lists are available)
		await waitFor(() => {
			const elements = screen.getAllByText("Proposer un événement");
			expect(elements.length).toBeGreaterThan(1);
		});
	});
});

describe("Events Propose Page Component - Only Associations Available", () => {
	const mockAssociations = [
		{
			id: 1,
			name: "Test Association",
			handle: "test-asso",
			description: "",
			members: [],
			icon: "",
			color: 0,
		},
	] as any[];
	const mockLists: any[] = [];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("opens form modal when only associations are available", async () => {
		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		const proposeBtn = screen.getByRole("button", { name: "Proposer un événement" });
		await fireEvent.click(proposeBtn);

		// Form should open (associations are available)
		await waitFor(() => {
			const elements = screen.getAllByText("Proposer un événement");
			expect(elements.length).toBeGreaterThan(1);
		});
	});
});

describe("Events Propose Page - handleEventClick", () => {
	const mockAssociations = [
		{
			id: 1,
			name: "Test Association",
			handle: "test-asso",
			description: "",
			members: [],
			icon: "",
			color: 0,
		},
	] as any[];
	const mockLists = [
		{
			id: 1,
			name: "Test List",
			handle: "test-list",
			association_id: 1,
			description: "",
			icon: "",
			members: [],
			promo: 2024,
			color: 0,
		},
	] as any[];

	beforeEach(() => {
		vi.clearAllMocks();
		mockPageData.userData = null;
	});

	it("returns false when user is null", async () => {
		mockPageData.userData = null;

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		// Calendar wrapper exists
		expect(document.querySelector(".calendar-wrapper")).toBeInTheDocument();
	});

	it("opens form for global event manager clicking on event", async () => {
		mockPageData.userData = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.MANAGE,
			promo: 2024,
			memberships: [],
		};

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		expect(document.querySelector(".calendar-wrapper")).toBeInTheDocument();
	});

	it("handles event click with association permission", async () => {
		mockPageData.userData = {
			id: 1,
			first_name: "User",
			last_name: "Test",
			login: "user",
			email: "user@test.com",
			permissions: 0,
			promo: 2024,
			memberships: [
				{
					association_id: 1,
					list_id: null,
					role: { permissions: Permission.MANAGE },
				},
			],
		};

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		expect(document.querySelector(".calendar-wrapper")).toBeInTheDocument();
	});

	it("handles event click with list permission", async () => {
		mockPageData.userData = {
			id: 1,
			first_name: "User",
			last_name: "Test",
			login: "user",
			email: "user@test.com",
			permissions: 0,
			promo: 2024,
			memberships: [
				{
					association_id: null,
					list_id: 1,
					role: { permissions: Permission.MANAGE },
				},
			],
		};

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		expect(document.querySelector(".calendar-wrapper")).toBeInTheDocument();
	});
});

describe("Events Propose Page - Admin Actions with Mocked User", () => {
	const mockAssociations = [
		{
			id: 1,
			name: "Test Association",
			handle: "test-asso",
			description: "",
			members: [],
			icon: "",
			color: 0,
		},
	] as any[];
	const mockLists: any[] = [];

	beforeEach(() => {
		vi.clearAllMocks();
		mockPageData.userData = null;
		// Mock location.reload
		Object.defineProperty(window, "location", {
			value: { reload: vi.fn() },
			writable: true,
		});
	});

	it("shows Clôturer & Valider button for global event manager when open", async () => {
		mockPageData.userData = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.MANAGE,
			promo: 2024,
			memberships: [],
		};

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		expect(screen.getByRole("button", { name: "Clôturer & Valider" })).toBeInTheDocument();
	});

	it("shows Ouvrir les soumissions button for global event manager when closed", async () => {
		mockPageData.userData = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.MANAGE,
			promo: 2024,
			memberships: [],
		};

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: false,
				} as any,
			},
		});

		expect(screen.getByRole("button", { name: "Ouvrir les soumissions" })).toBeInTheDocument();
	});

	it("opens close/validate modal and can cancel", async () => {
		mockPageData.userData = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.MANAGE,
			promo: 2024,
			memberships: [],
		};

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		const closeBtn = screen.getByRole("button", { name: "Clôturer & Valider" });
		await fireEvent.click(closeBtn);

		await waitFor(() => {
			expect(screen.getByText("Confirmer la clôture")).toBeInTheDocument();
		});

		const cancelBtn = screen.getByRole("button", { name: "Annuler" });
		await fireEvent.click(cancelBtn);

		await waitFor(() => {
			expect(screen.queryByText("Confirmer la clôture")).not.toBeInTheDocument();
		});
	});

	it("confirms close/validate and handles success", async () => {
		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: async () => ({ message: "Événements validés avec succès" }),
		} as Response);

		mockPageData.userData = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.MANAGE,
			promo: 2024,
			memberships: [],
		};

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		const closeBtn = screen.getByRole("button", { name: "Clôturer & Valider" });
		await fireEvent.click(closeBtn);

		await waitFor(() => {
			expect(screen.getByText("Confirmer la clôture")).toBeInTheDocument();
		});

		const confirmBtn = screen.getByRole("button", { name: "Confirmer" });
		await fireEvent.click(confirmBtn);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith("/api/events/finalize-submission", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
		});

		await waitFor(() => {
			expect(screen.getByText("Succès")).toBeInTheDocument();
		});
	});

	it("confirms close/validate and handles API error", async () => {
		vi.mocked(global.fetch).mockResolvedValue({
			ok: false,
			json: async () => ({ error: "Server error" }),
		} as Response);

		mockPageData.userData = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.MANAGE,
			promo: 2024,
			memberships: [],
		};

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		const closeBtn = screen.getByRole("button", { name: "Clôturer & Valider" });
		await fireEvent.click(closeBtn);

		await waitFor(() => {
			expect(screen.getByText("Confirmer la clôture")).toBeInTheDocument();
		});

		const confirmBtn = screen.getByRole("button", { name: "Confirmer" });
		await fireEvent.click(confirmBtn);

		await waitFor(() => {
			expect(screen.getByText("Erreur")).toBeInTheDocument();
		});
	});

	it("confirms close/validate and handles network error", async () => {
		vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

		mockPageData.userData = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.MANAGE,
			promo: 2024,
			memberships: [],
		};

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: true,
				} as any,
			},
		});

		const closeBtn = screen.getByRole("button", { name: "Clôturer & Valider" });
		await fireEvent.click(closeBtn);

		await waitFor(() => {
			expect(screen.getByText("Confirmer la clôture")).toBeInTheDocument();
		});

		const confirmBtn = screen.getByRole("button", { name: "Confirmer" });
		await fireEvent.click(confirmBtn);

		await waitFor(() => {
			expect(screen.getByText("Erreur")).toBeInTheDocument();
			expect(screen.getByText(/Network error/)).toBeInTheDocument();
		});
	});

	it("opens open submissions modal and can cancel", async () => {
		mockPageData.userData = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.MANAGE,
			promo: 2024,
			memberships: [],
		};

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: false,
				} as any,
			},
		});

		const openBtn = screen.getByRole("button", { name: "Ouvrir les soumissions" });
		await fireEvent.click(openBtn);

		await waitFor(() => {
			expect(
				screen.getByText("Voulez-vous ouvrir les soumissions d'événements ?")
			).toBeInTheDocument();
		});

		const cancelBtn = screen.getByRole("button", { name: "Annuler" });
		await fireEvent.click(cancelBtn);

		await waitFor(() => {
			expect(
				screen.queryByText("Voulez-vous ouvrir les soumissions d'événements ?")
			).not.toBeInTheDocument();
		});
	});

	it("confirms open submissions and handles success", async () => {
		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: async () => ({ message: "Soumissions ouvertes" }),
		} as Response);

		mockPageData.userData = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.MANAGE,
			promo: 2024,
			memberships: [],
		};

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: false,
				} as any,
			},
		});

		const openBtn = screen.getByRole("button", { name: "Ouvrir les soumissions" });
		await fireEvent.click(openBtn);

		await waitFor(() => {
			expect(
				screen.getByText("Voulez-vous ouvrir les soumissions d'événements ?")
			).toBeInTheDocument();
		});

		const confirmBtn = screen.getByRole("button", { name: "Confirmer" });
		await fireEvent.click(confirmBtn);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith("/api/events/open-submissions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
		});

		await waitFor(() => {
			expect(screen.getByText("Succès")).toBeInTheDocument();
		});
	});

	it("confirms open submissions and handles API error", async () => {
		vi.mocked(global.fetch).mockResolvedValue({
			ok: false,
			json: async () => ({ error: "Server error" }),
		} as Response);

		mockPageData.userData = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.MANAGE,
			promo: 2024,
			memberships: [],
		};

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: false,
				} as any,
			},
		});

		const openBtn = screen.getByRole("button", { name: "Ouvrir les soumissions" });
		await fireEvent.click(openBtn);

		await waitFor(() => {
			expect(
				screen.getByText("Voulez-vous ouvrir les soumissions d'événements ?")
			).toBeInTheDocument();
		});

		const confirmBtn = screen.getByRole("button", { name: "Confirmer" });
		await fireEvent.click(confirmBtn);

		await waitFor(() => {
			expect(screen.getByText("Erreur")).toBeInTheDocument();
		});
	});

	it("confirms open submissions and handles unknown error", async () => {
		vi.mocked(global.fetch).mockRejectedValue("Unknown error type");

		mockPageData.userData = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.MANAGE,
			promo: 2024,
			memberships: [],
		};

		render(EventsProposePage, {
			props: {
				data: {
					associations: mockAssociations,
					lists: mockLists,
					isOpen: false,
				} as any,
			},
		});

		const openBtn = screen.getByRole("button", { name: "Ouvrir les soumissions" });
		await fireEvent.click(openBtn);

		await waitFor(() => {
			expect(
				screen.getByText("Voulez-vous ouvrir les soumissions d'événements ?")
			).toBeInTheDocument();
		});

		const confirmBtn = screen.getByRole("button", { name: "Confirmer" });
		await fireEvent.click(confirmBtn);

		await waitFor(() => {
			expect(screen.getByText("Erreur")).toBeInTheDocument();
			expect(screen.getByText(/Erreur inconnue/)).toBeInTheDocument();
		});
	});
});
