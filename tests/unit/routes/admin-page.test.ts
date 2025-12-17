import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminPage from "../../../src/routes/admin/+page.svelte";
import Permission from "../../../src/lib/permissions";

// Mock $app/paths
vi.mock("$app/paths", () => ({
	resolve: (path: string) => path,
}));

// Mock $app/state
vi.mock("$app/state", () => ({
	page: {
		url: {
			searchParams: new URLSearchParams(),
		},
	},
}));

describe("Admin Page", () => {
	const mockUsers = [
		{
			id: 1,
			first_name: "John",
			last_name: "Doe",
			email: "john@example.com",
			login: "jdoe",
			promo: 2024,
			permissions: 0,
		},
		{
			id: 2,
			first_name: "Admin",
			last_name: "User",
			email: "admin@example.com",
			login: "admin",
			promo: 2024,
			permissions: Permission.ADMIN,
		},
	];
	const mockAssociations = [
		{ id: 1, name: "Asso 1", handle: "asso-1", description: "Desc 1", color: 0 },
	];
	const mockUserRoles = [
		{
			role_name: "Membre",
			permissions: 0,
			association_name: "BDE",
			list_name: null,
		},
	];
	const mockConfig = {
		maintenance_mode: "false",
		global_announcement: "Hello World",
		event_submission_open: "true",
	};

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn().mockImplementation((url) => {
			if (url.includes("/api/users/1/roles")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockUserRoles),
				});
			}
			if (url.includes("/api/users")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockUsers),
				});
			}
			if (url.includes("/api/associations")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockAssociations),
				});
			}
			if (url.includes("/api/config")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockConfig),
				});
			}
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve([]),
			});
		}) as unknown as typeof fetch; // Mock confirm
		global.confirm = vi.fn(() => true);
		// Mock alert
		global.alert = vi.fn();
	});

	it("renders the admin panel brand", () => {
		render(AdminPage);
		expect(screen.getByText("Admin Panel")).toBeInTheDocument();
	});

	it("loads and displays dashboard by default", async () => {
		render(AdminPage);
		await waitFor(() => {
			expect(screen.getByRole("heading", { name: "Tableau de bord" })).toBeInTheDocument();
			// Check stats
			expect(screen.getByRole("heading", { name: "Utilisateurs" })).toBeInTheDocument();
			expect(screen.getByRole("heading", { name: "Administrateurs" })).toBeInTheDocument();
			expect(screen.getByRole("heading", { name: "Associations" })).toBeInTheDocument();
		});
	});

	it("switches to users view and displays users", async () => {
		render(AdminPage);

		const usersNav = screen.getByRole("button", { name: "Utilisateurs" });
		await fireEvent.click(usersNav);

		await waitFor(() => {
			expect(screen.getAllByText("John")[0]).toBeInTheDocument();
			expect(screen.getAllByText("Doe")[0]).toBeInTheDocument();
			expect(screen.getByText("jdoe")).toBeInTheDocument();
			expect(screen.getAllByText("Admin")[0]).toBeInTheDocument();
			expect(screen.getAllByText("User")[0]).toBeInTheDocument();
		});
	});

	it("filters users by search", async () => {
		render(AdminPage);

		const usersNav = screen.getByRole("button", { name: "Utilisateurs" });
		await fireEvent.click(usersNav);

		await waitFor(() => {
			expect(screen.getAllByText("John")[0]).toBeInTheDocument();
		});

		const searchInput = screen.getByPlaceholderText("Rechercher...");
		await fireEvent.input(searchInput, { target: { value: "Admin" } });

		await waitFor(() => {
			expect(screen.queryByText("John")).not.toBeInTheDocument();
			expect(screen.getAllByText("Admin")[0]).toBeInTheDocument();
		});
	});

	it("filters users by admin status", async () => {
		render(AdminPage);

		const usersNav = screen.getByRole("button", { name: "Utilisateurs" });
		await fireEvent.click(usersNav);

		await waitFor(() => {
			expect(screen.getAllByText("John")[0]).toBeInTheDocument();
		});

		const adminCheckbox = screen.getByLabelText("Admins seulement");
		await fireEvent.click(adminCheckbox);

		await waitFor(() => {
			expect(screen.queryByText("John")).not.toBeInTheDocument();
			expect(screen.getAllByText("Admin")[0]).toBeInTheDocument();
		});
	});

	it("switches to associations view and displays associations", async () => {
		render(AdminPage);

		const assosNav = screen.getByRole("button", { name: "Associations" });
		await fireEvent.click(assosNav);

		await waitFor(() => {
			expect(screen.getByText("Asso 1")).toBeInTheDocument();
			expect(screen.getByText("asso-1")).toBeInTheDocument();
		});
	});

	it("views user details", async () => {
		render(AdminPage);

		const usersNav = screen.getByRole("button", { name: "Utilisateurs" });
		await fireEvent.click(usersNav);

		await waitFor(() => {
			expect(screen.getAllByText("John")[0]).toBeInTheDocument();
		});

		const detailsBtns = screen.getAllByText("Détails");
		await fireEvent.click(detailsBtns[0]);

		await waitFor(() => {
			expect(screen.getByText("Détails de John Doe")).toBeInTheDocument();
			expect(screen.getAllByText("Membre").length).toBeGreaterThan(0);
			expect(screen.getByText("BDE")).toBeInTheDocument();
		});
	});

	it("deletes a user", async () => {
		render(AdminPage);

		const usersNav = screen.getByRole("button", { name: "Utilisateurs" });
		await fireEvent.click(usersNav);

		await waitFor(() => {
			expect(screen.getAllByText("John")[0]).toBeInTheDocument();
		});

		const deleteBtns = screen.getAllByText("Supprimer");
		await fireEvent.click(deleteBtns[0]);

		expect(global.confirm).toHaveBeenCalled();
		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining("/api/users"),
			expect.objectContaining({
				method: "DELETE",
				body: JSON.stringify({ id: 1 }),
			})
		);
	});

	it("manages system configuration", async () => {
		render(AdminPage);

		const systemNav = screen.getByRole("button", { name: "Système" });
		await fireEvent.click(systemNav);

		await waitFor(() => {
			expect(screen.getByText("Configuration du Système")).toBeInTheDocument();
			expect(screen.getByLabelText("Mode Maintenance")).not.toBeChecked();
			expect(screen.getByDisplayValue("Hello World")).toBeInTheDocument();
		});

		// Toggle maintenance mode
		const maintenanceCheckbox = screen.getByLabelText("Mode Maintenance");
		await fireEvent.click(maintenanceCheckbox);

		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining("/api/config"),
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ key: "maintenance_mode", value: "true" }),
			})
		);
	});

	it("handles fetch error", async () => {
		vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));
		render(AdminPage);
		await waitFor(() =>
			expect(screen.getByText("Erreur de chargement des données")).toBeInTheDocument()
		);
	});
});
