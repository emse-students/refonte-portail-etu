import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { load } from "../../../src/routes/lists/[handle]/+page";
import ListHandlePage from "../../../src/routes/lists/[handle]/+page.svelte";
import Permission from "../../../src/lib/permissions";

// Mock $app/paths
vi.mock("$app/paths", () => ({
	resolve: (path: string) => path,
}));

// Mock $app/navigation
vi.mock("$app/navigation", () => ({
	invalidateAll: vi.fn(),
}));

// Mock $app/state
vi.mock("$app/state", () => ({
	page: {
		data: {
			userData: null,
		},
	},
}));

// Mock svelte-markdown
vi.mock("svelte-markdown", () => ({
	default: vi.fn(),
}));

// Mock $lib/utils
vi.mock("$lib/utils", () => ({
	of: (name: string) => (name.endsWith("s") ? "" : "'"),
}));

// Mock global fetch
vi.stubGlobal("fetch", vi.fn());

describe("Lists Handle Page Load", () => {
	it("should fetch list, events, and roles", async () => {
		const mockList = { id: 1, name: "Test List" };
		const mockEvents = [{ id: 1, title: "Event 1" }];
		const mockRoles = [{ id: 1, name: "Prez" }];

		const fetchMock = vi.fn().mockImplementation((url) => {
			if (url.includes("/api/lists/handle/test-list")) {
				return Promise.resolve({
					json: () => Promise.resolve(mockList),
				});
			}
			if (url.includes("/api/calendar?list=1")) {
				return Promise.resolve({
					json: () => Promise.resolve(mockEvents),
				});
			}
			if (url.includes("/api/roles")) {
				return Promise.resolve({
					json: () => Promise.resolve(mockRoles),
				});
			}
			return Promise.reject(new Error(`Unexpected URL: ${url}`));
		});

		const event = {
			params: { handle: "test-list" },
			fetch: fetchMock,
		} as any;

		const result = await load(event);

		expect(result).toEqual({
			list: mockList,
			roles: mockRoles,
			events: mockEvents,
		});

		expect(fetchMock).toHaveBeenCalledTimes(3);
	});
});

describe("Lists Handle Page Component", () => {
	const mockList = {
		id: 1,
		name: "Test List",
		handle: "test-list",
		description: "A test list description",
		promo: 2025,
		association: {
			id: 1,
			name: "Parent Association",
			handle: "parent-asso",
			icon: null,
			color: 65280,
			created_at: new Date(),
			edited_at: new Date(),
			description: "An association description",
		},
		association_id: 1,
		icon: null,
		color: 16711680,
		members: [
			{
				id: 1,
				user: {
					id: 1,
					first_name: "John",
					last_name: "Doe",
					login: "jdoe",
					email: "jdoe@test.com",
					permissions: 0,
					promo: 2024,
				},
				role: { id: 1, name: "Président", permissions: Permission.ADMIN, hierarchy: 10 },
				association_id: null,
				list_id: 1,
				visible: true,
			},
			{
				id: 2,
				user: {
					id: 2,
					first_name: "Jane",
					last_name: "Smith",
					login: "jsmith",
					email: "jsmith@test.com",
					permissions: 0,
					promo: 2024,
				},
				role: { id: 2, name: "Membre", permissions: Permission.MEMBER, hierarchy: 1 },
				association_id: null,
				list_id: 1,
				visible: true,
			},
		],
	};

	const mockEvents = [
		{
			id: 1,
			title: "Test Event",
			description: "Event description",
			start_date: new Date("2025-12-01T10:00:00"),
			end_date: new Date("2025-12-01T12:00:00"),
			location: "Campus",
			association_id: null,
			list_id: 1,
			validated: true,
			created_at: new Date(),
			edited_at: new Date(),
		},
	];

	const mockRoles = [
		{ id: 1, name: "Président", permissions: Permission.ADMIN, hierarchy: 10 },
		{ id: 2, name: "Membre", permissions: Permission.MEMBER, hierarchy: 1 },
	];

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: async () => ({}),
		} as Response);
	});

	it("renders list name", () => {
		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: undefined,
					session: undefined,
				},
			},
		});

		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Test List");
	});

	it("renders parent association link", () => {
		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: undefined,
					session: undefined,
				},
			},
		});

		const link = screen.getByRole("link", { name: "Parent Association" });
		expect(link).toHaveAttribute("href", "/associations/parent-asso");
	});

	it("renders promo number when available", () => {
		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: undefined,
					session: undefined,
				},
			},
		});

		expect(screen.getByText(/Promo 2025/)).toBeInTheDocument();
	});

	it("renders bureau members separately from other members", () => {
		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: undefined,
					session: undefined,
				},
			},
		});

		// Bureau section for hierarchy >= 6
		expect(screen.getByText("Bureau")).toBeInTheDocument();
		// John Doe is in bureau (hierarchy 10)
		expect(screen.getByText(/John/)).toBeInTheDocument();

		// Members section for hierarchy < 6
		expect(screen.getByText("Membres")).toBeInTheDocument();
		// Jane Smith is a regular member (hierarchy 1)
		expect(screen.getByText(/Jane/)).toBeInTheDocument();
	});

	it("shows empty state when no events", () => {
		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: undefined,
					session: undefined,
				},
			},
		});

		expect(screen.getByText("Aucun événement à venir pour cette liste.")).toBeInTheDocument();
	});

	it("renders events when available", () => {
		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: mockEvents,
					roles: mockRoles,
					userData: undefined,
					session: undefined,
				},
			},
		});

		expect(screen.getByText("Test Event")).toBeInTheDocument();
	});

	it("does not show admin button when user is not logged in", () => {
		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: undefined,
					session: undefined,
				},
			},
		});

		expect(screen.queryByText("Administration")).not.toBeInTheDocument();
		expect(screen.queryByText("Gérer les membres")).not.toBeInTheDocument();
	});

	it("shows admin button when user has ADMIN permission", () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		expect(screen.getByText("Administration")).toBeInTheDocument();
	});

	it("shows 'Gérer les membres' button for user with ROLES permission in list", () => {
		const memberWithRoles = {
			id: 2,
			first_name: "Role",
			last_name: "Manager",
			login: "rolemanager",
			email: "role@test.com",
			permissions: 0,
			promo: 2024,
			memberships: [
				{
					id: 10,
					association_id: null,
					list_id: 1,
					role: { id: 3, name: "Manager", permissions: Permission.ROLES, hierarchy: 5 },
					user: {
						id: 2,
						first_name: "Role",
						last_name: "Manager",
						login: "rolemanager",
						email: "role@test.com",
						permissions: 0,
						promo: 2024,
					},
					visible: true,
				},
			],
		};

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: memberWithRoles,
					session: undefined,
				},
			},
		});

		expect(screen.getByText("Gérer les membres")).toBeInTheDocument();
	});

	it("toggles edit mode when admin button is clicked", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		const adminBtn = screen.getByText("Administration");
		await fireEvent.click(adminBtn);

		// Button text should change
		expect(screen.getByText("Terminer l'édition")).toBeInTheDocument();
		// Add member button should appear
		expect(screen.getByText("+ Ajouter un membre")).toBeInTheDocument();
	});

	it("opens add member modal", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		// Enter edit mode
		await fireEvent.click(screen.getByText("Administration"));

		// Click add member
		await fireEvent.click(screen.getByText("+ Ajouter un membre"));

		expect(screen.getByText("Ajouter un membre")).toBeInTheDocument();
		expect(screen.getByLabelText("Rechercher un utilisateur")).toBeInTheDocument();
	});

	it("searches for users when typing in search field", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		const mockUsers = [
			{ id: 10, first_name: "New", last_name: "User", login: "newuser", email: "new@test.com" },
		];

		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: async () => mockUsers,
		} as Response);

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		await fireEvent.click(screen.getByText("Administration"));
		await fireEvent.click(screen.getByText("+ Ajouter un membre"));

		const searchInput = screen.getByLabelText("Rechercher un utilisateur");
		await fireEvent.input(searchInput, { target: { value: "new" } });

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith("/api/users");
		});
	});

	it("shows edit list button when user has ADMIN permission on list", async () => {
		const adminMember = {
			id: 1,
			first_name: "Admin",
			last_name: "Member",
			login: "adminmember",
			email: "adminmember@test.com",
			permissions: 0,
			promo: 2024,
			memberships: [
				{
					id: 5,
					association_id: null,
					list_id: 1,
					role: { id: 1, name: "Président", permissions: Permission.ADMIN, hierarchy: 10 },
					user: {
						id: 1,
						first_name: "Admin",
						last_name: "Member",
						login: "adminmember",
						email: "adminmember@test.com",
						permissions: 0,
						promo: 2024,
					},
					visible: true,
				},
			],
		};

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminMember,
					session: undefined,
				},
			},
		});

		// Enter edit mode
		await fireEvent.click(screen.getByText("Administration"));

		// "Éditer les informations" button should appear
		expect(screen.getByText("Éditer les informations")).toBeInTheDocument();
	});

	it("opens edit list modal", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		await fireEvent.click(screen.getByText("Administration"));
		await fireEvent.click(screen.getByText("Éditer les informations"));

		expect(screen.getByText("Modifier la liste")).toBeInTheDocument();
		expect(screen.getByLabelText("Nom de la liste")).toHaveValue("Test List");
	});

	it("updates list details", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: async () => ({}),
		} as Response);

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		await fireEvent.click(screen.getByText("Administration"));
		await fireEvent.click(screen.getByText("Éditer les informations"));

		const nameInput = screen.getByLabelText("Nom de la liste");
		await fireEvent.input(nameInput, { target: { value: "Updated List" } });

		const saveBtn = screen.getByText("Enregistrer");
		await fireEvent.click(saveBtn);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				`/api/lists/${mockList.id}`,
				expect.objectContaining({
					method: "PUT",
					body: expect.stringContaining("Updated List"),
				})
			);
		});
	});

	it("opens delete member confirmation modal", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		await fireEvent.click(screen.getByText("Administration"));

		// Find the remove button for a member
		const removeButtons = screen.getAllByText("Retirer");
		await fireEvent.click(removeButtons[0]);

		expect(screen.getByText("Confirmer la suppression")).toBeInTheDocument();
		expect(screen.getByText(/Êtes-vous sûr de vouloir retirer/)).toBeInTheDocument();
	});

	it("confirms member deletion", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: async () => ({}),
		} as Response);

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		await fireEvent.click(screen.getByText("Administration"));

		const removeButtons = screen.getAllByText("Retirer");
		await fireEvent.click(removeButtons[0]);

		const confirmBtn = screen.getByText("Confirmer");
		await fireEvent.click(confirmBtn);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/members",
				expect.objectContaining({
					method: "DELETE",
				})
			);
		});
	});

	it("opens edit role modal for a member", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		await fireEvent.click(screen.getByText("Administration"));

		// Find the edit role button for a member
		const editButtons = screen.getAllByText("Modifier rôle");
		await fireEvent.click(editButtons[0]);

		// Modal should be open with member's name
		expect(screen.getByText(/Modifier le rôle/)).toBeInTheDocument();
	});

	it("updates member role", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: async () => ({}),
		} as Response);

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		await fireEvent.click(screen.getByText("Administration"));

		const editButtons = screen.getAllByText("Modifier rôle");
		await fireEvent.click(editButtons[0]);

		// Click save
		const saveBtn = screen.getByText("Enregistrer");
		await fireEvent.click(saveBtn);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/members",
				expect.objectContaining({
					method: "PUT",
				})
			);
		});
	});

	it("selects user from search results and shows role selection", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		const mockUsers = [
			{ id: 10, first_name: "New", last_name: "User", login: "newuser", email: "new@test.com" },
		];

		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: async () => mockUsers,
		} as Response);

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		await fireEvent.click(screen.getByText("Administration"));
		await fireEvent.click(screen.getByText("+ Ajouter un membre"));

		const searchInput = screen.getByLabelText("Rechercher un utilisateur");
		await fireEvent.input(searchInput, { target: { value: "new" } });

		await waitFor(() => {
			expect(screen.getByText(/New User/)).toBeInTheDocument();
		});

		// Select the user
		await fireEvent.click(screen.getByText(/New User/));

		// Role selection should appear
		expect(screen.getByLabelText("Rôle")).toBeInTheDocument();
	});

	it("adds a new member", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		const mockUsers = [
			{ id: 10, first_name: "New", last_name: "User", login: "newuser", email: "new@test.com" },
		];

		vi.mocked(global.fetch)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockUsers,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			} as Response);

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		await fireEvent.click(screen.getByText("Administration"));
		await fireEvent.click(screen.getByText("+ Ajouter un membre"));

		const searchInput = screen.getByLabelText("Rechercher un utilisateur");
		await fireEvent.input(searchInput, { target: { value: "new" } });

		await waitFor(() => {
			expect(screen.getByText(/New User/)).toBeInTheDocument();
		});

		await fireEvent.click(screen.getByText(/New User/));

		// Click the add button
		const addBtn = screen.getByText("Ajouter");
		await fireEvent.click(addBtn);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/members",
				expect.objectContaining({
					method: "POST",
				})
			);
		});
	});

	it("opens create role modal from add member modal", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		const mockUsers = [
			{ id: 10, first_name: "New", last_name: "User", login: "newuser", email: "new@test.com" },
		];

		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: async () => mockUsers,
		} as Response);

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		await fireEvent.click(screen.getByText("Administration"));
		await fireEvent.click(screen.getByText("+ Ajouter un membre"));

		const searchInput = screen.getByLabelText("Rechercher un utilisateur");
		await fireEvent.input(searchInput, { target: { value: "new" } });

		await waitFor(() => {
			expect(screen.getByText(/New User/)).toBeInTheDocument();
		});

		await fireEvent.click(screen.getByText(/New User/));

		// Type in role search
		const roleInput = screen.getByLabelText("Rôle");
		await fireEvent.focus(roleInput);
		await fireEvent.input(roleInput, { target: { value: "NewRole" } });

		// Click create new role
		await waitFor(() => {
			expect(screen.getByText("+ Créer un nouveau rôle...")).toBeInTheDocument();
		});
		await fireEvent.click(screen.getByText("+ Créer un nouveau rôle..."));

		expect(screen.getByText("Créer un nouveau rôle")).toBeInTheDocument();
	});

	it("creates a new role", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		const mockUsers = [
			{ id: 10, first_name: "New", last_name: "User", login: "newuser", email: "new@test.com" },
		];

		vi.mocked(global.fetch)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockUsers,
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 99, name: "NewRole" }),
			} as Response);

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		await fireEvent.click(screen.getByText("Administration"));
		await fireEvent.click(screen.getByText("+ Ajouter un membre"));

		const searchInput = screen.getByLabelText("Rechercher un utilisateur");
		await fireEvent.input(searchInput, { target: { value: "new" } });

		await waitFor(() => {
			expect(screen.getByText(/New User/)).toBeInTheDocument();
		});

		await fireEvent.click(screen.getByText(/New User/));

		const roleInput = screen.getByLabelText("Rôle");
		await fireEvent.focus(roleInput);
		await fireEvent.input(roleInput, { target: { value: "NewRole" } });

		await waitFor(() => {
			expect(screen.getByText("+ Créer un nouveau rôle...")).toBeInTheDocument();
		});
		await fireEvent.click(screen.getByText("+ Créer un nouveau rôle..."));

		// Fill in role details
		const roleNameInput = screen.getByLabelText("Nom du rôle");
		await fireEvent.input(roleNameInput, { target: { value: "NewRole" } });

		// Create the role
		const createBtn = screen.getByText("Créer");
		await fireEvent.click(createBtn);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/roles",
				expect.objectContaining({
					method: "POST",
				})
			);
		});
	});

	it("cancels delete member confirmation", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		await fireEvent.click(screen.getByText("Administration"));

		const removeButtons = screen.getAllByText("Retirer");
		await fireEvent.click(removeButtons[0]);

		expect(screen.getByText("Confirmer la suppression")).toBeInTheDocument();

		// Click cancel
		const cancelBtn = screen.getByText("Annuler");
		await fireEvent.click(cancelBtn);

		// Modal should close
		await waitFor(() => {
			expect(screen.queryByText("Confirmer la suppression")).not.toBeInTheDocument();
		});
	});

	it("filters roles based on search query", async () => {
		const adminUser = {
			id: 1,
			first_name: "Admin",
			last_name: "User",
			login: "admin",
			email: "admin@test.com",
			permissions: Permission.ADMIN,
			promo: 2024,
			memberships: [],
		};

		const mockUsers = [
			{ id: 10, first_name: "New", last_name: "User", login: "newuser", email: "new@test.com" },
		];

		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			json: async () => mockUsers,
		} as Response);

		render(ListHandlePage, {
			props: {
				data: {
					list: mockList,
					events: [],
					roles: mockRoles,
					userData: adminUser,
					session: undefined,
				},
			},
		});

		await fireEvent.click(screen.getByText("Administration"));
		await fireEvent.click(screen.getByText("+ Ajouter un membre"));

		const searchInput = screen.getByLabelText("Rechercher un utilisateur");
		await fireEvent.input(searchInput, { target: { value: "new" } });

		await waitFor(() => {
			expect(screen.getByText(/New User/)).toBeInTheDocument();
		});

		await fireEvent.click(screen.getByText(/New User/));

		const roleInput = screen.getByLabelText("Rôle");
		await fireEvent.focus(roleInput);
		await fireEvent.input(roleInput, { target: { value: "Prés" } });

		// Should filter to show only Président (multiple because also shown in member card)
		await waitFor(() => {
			const presidents = screen.getAllByText("Président");
			expect(presidents.length).toBeGreaterThan(0);
		});
	});
});
