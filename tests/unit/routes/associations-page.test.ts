import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AssociationsPage from "../../../src/routes/associations/[handle]/+page.svelte";
import Permission from "../../../src/lib/permissions";

// Mock components
vi.mock("svelte-markdown", async () => {
	const SvelteMarkdownMock = await import("../../mocks/SvelteMarkdownMock.svelte");
	return { default: SvelteMarkdownMock.default };
});

vi.mock("../../../src/lib/utils.js", () => ({
	of: () => "de ",
}));

vi.mock("../../../src/lib/components/MemberCard.svelte", async () => {
	const MemberCardMock = await import("../../mocks/MemberCardMock.svelte");
	return { default: MemberCardMock.default };
});

vi.mock("../../../src/lib/components/EventCard.svelte", async () => {
	const EventCardMock = await import("../../mocks/EventCardMock.svelte");
	return { default: EventCardMock.default };
});

vi.mock("../../../src/lib/components/Modal.svelte", async () => {
	const ModalMock = await import("../../mocks/ModalMock.svelte");
	return { default: ModalMock.default };
});

// Mock navigation
vi.mock("$app/navigation", () => ({
	invalidateAll: vi.fn(),
}));

describe("Associations Page", () => {
	const mockAssociation = {
		id: 1,
		name: "Test Asso",
		description: "Test Description",
		members: [
			{
				id: 1,
				user: { id: 1, first_name: "John", last_name: "Doe" },
				role_name: "Prez",
				hierarchy: 10,
				permissions: 0,
				visible: true,
			},
			{
				id: 2,
				user: { id: 2, first_name: "Jane", last_name: "Smith" },
				role_name: "Member",
				hierarchy: 1,
				permissions: 0,
				visible: true,
			},
		],
	};

	const mockEvents = [{ id: 1, title: "Event 1" }];

	const mockData = {
		association: mockAssociation,
		events: mockEvents,
		userData: {
			permissions: 0,
			memberships: [],
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({}),
		} as Response) as unknown as typeof fetch;
	});

	it("renders association details", () => {
		render(AssociationsPage, { data: mockData } as any);
		expect(screen.getByRole("heading", { name: "Test Asso" })).toBeInTheDocument();
		expect(screen.getByText("Test Description")).toBeInTheDocument();
	});

	it("renders members separated by hierarchy", () => {
		render(AssociationsPage, { data: mockData } as any);
		expect(screen.getByText("Bureau")).toBeInTheDocument();
		expect(screen.getByText("Membres")).toBeInTheDocument();
		// Check for member names (mocked in MemberCardMock usually, but here we check if cards are rendered)
		// Since we use MemberCardMock, we might check for testids or content if the mock renders props
	});

	it("renders events", () => {
		render(AssociationsPage, { data: mockData } as any);
		expect(screen.getByText("Événements à venir")).toBeInTheDocument();
		// Check for event card presence
	});

	it("shows admin button if user has permission", async () => {
		const adminData = {
			...mockData,
			userData: {
				permissions: Permission.ADMIN,
				memberships: [],
			},
		};
		render(AssociationsPage, { data: adminData } as any);

		const adminBtn = screen.getByText("Gérer l'association");
		expect(adminBtn).toBeInTheDocument();

		await fireEvent.click(adminBtn);
		expect(screen.getByText("Terminer l'édition")).toBeInTheDocument();
		expect(screen.getByText("+ Ajouter un membre")).toBeInTheDocument();
	});

	it("allows adding a member", async () => {
		const adminData = {
			...mockData,
			userData: {
				permissions: Permission.ADMIN,
				memberships: [],
			},
		};
		render(AssociationsPage, { data: adminData } as any);

		// Enter edit mode
		await fireEvent.click(screen.getByText("Gérer l'association"));

		// Click add member
		await fireEvent.click(screen.getByText("+ Ajouter un membre"));

		// Mock user search response
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve([{ id: 3, first_name: "New", last_name: "User", login: "newuser" }]),
		} as Response);

		// Search user
		const searchInput = screen.getByLabelText("Rechercher un utilisateur");
		await fireEvent.input(searchInput, { target: { value: "New" } });

		// Wait for results and click
		await waitFor(() => expect(screen.getByText("New User (newuser)")).toBeInTheDocument());
		await fireEvent.click(screen.getByText("New User (newuser)"));

		// Mock add member response
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, id: 10 }),
		} as Response);

		// Click Add
		await fireEvent.click(screen.getByText("Ajouter"));

		expect(global.fetch).toHaveBeenCalledWith(
			"/api/members",
			expect.objectContaining({
				method: "POST",
				body: expect.stringContaining('"user_id":3'),
			})
		);
	});
});
