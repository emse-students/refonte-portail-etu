import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ListsPage from "../../../src/routes/lists/[handle]/+page.svelte";
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

vi.mock("../../../src/lib/components/Modal.svelte", async () => {
	const ModalMock = await import("../../mocks/ModalMock.svelte");
	return { default: ModalMock.default };
});

// Mock navigation
vi.mock("$app/navigation", () => ({
	invalidateAll: vi.fn(),
}));

describe("Lists Page", () => {
	const mockList = {
		id: 1,
		name: "Test List",
		description: "Test Description",
		promo: 2024,
		association: { id: 10, name: "Parent Asso", handle: "parent-asso" },
		members: [
			{
				id: 1,
				user: { id: 1, first_name: "John", last_name: "Doe" },
				role: { id: 1, name: "Prez", hierarchy: 10, permissions: 0 },
				visible: true,
			},
		],
	};

	const mockRoles = [{ id: 1, name: "Prez" }];

	const mockData = {
		list: mockList,
		roles: mockRoles,
		userData: {
			permissions: 0,
			memberships: [],
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn() as unknown as typeof fetch;
	});

	it("renders list details", () => {
		render(ListsPage, { data: mockData } as any);
		expect(screen.getByRole("heading", { name: "Test List" })).toBeInTheDocument();
		expect(screen.getByText("Test Description")).toBeInTheDocument();
		expect(screen.getByText("Parent Asso")).toBeInTheDocument();
	});

	it("shows admin button if user has permission", async () => {
		const adminData = {
			...mockData,
			userData: {
				permissions: Permission.ADMIN,
				memberships: [],
			},
		};
		render(ListsPage, { data: adminData } as any);

		const adminBtn = screen.getByText("Gérer la liste");
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
		render(ListsPage, { data: adminData } as any);

		// Enter edit mode
		await fireEvent.click(screen.getByText("Gérer la liste"));

		// Click add member
		await fireEvent.click(screen.getByText("+ Ajouter un membre"));

		// Mock user search response
		vi.mocked(global.fetch).mockResolvedValueOnce({
			json: () =>
				Promise.resolve([{ id: 3, first_name: "New", last_name: "User", login: "newuser" }]),
		} as any);

		// Search user
		const searchInput = screen.getByLabelText("Rechercher un utilisateur");
		await fireEvent.input(searchInput, { target: { value: "New" } });

		// Wait for results and click
		await waitFor(() => expect(screen.getByText("New User (newuser)")).toBeInTheDocument());
		await fireEvent.click(screen.getByText("New User (newuser)"));

		// Mock add member response
		vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as any);

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
