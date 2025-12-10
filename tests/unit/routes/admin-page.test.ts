import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminPage from "../../../src/routes/admin/+page.svelte";

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
		},
	];
	const mockAssociations = [{ id: 1, name: "Asso 1", handle: "asso-1" }];
	const mockRoles = [{ id: 1, name: "Role 1" }];
	const mockLists = [{ id: 1, name: "List 1" }];
	const mockConfig = {
		event_submission_open: "true",
	};

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn().mockImplementation((url) => {
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
			if (url.includes("/api/roles")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockRoles),
				});
			}
			if (url.includes("/api/lists")) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockLists),
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
		}) as unknown as typeof fetch;

		// Mock confirm
		global.confirm = vi.fn(() => true);
		// Mock alert
		global.alert = vi.fn();
	});

	it("renders the admin page title", () => {
		render(AdminPage);
		expect(
			screen.getByRole("heading", { name: "Administration Base de Données" })
		).toBeInTheDocument();
	});

	it("loads and displays users by default", async () => {
		render(AdminPage);
		await waitFor(() => {
			expect(screen.getByText("John")).toBeInTheDocument();
			expect(screen.getByText("Doe")).toBeInTheDocument();
		});
	});

	it("switches tabs correctly", async () => {
		render(AdminPage);

		const assoTab = screen.getByText("Associations");
		await fireEvent.click(assoTab);

		expect(global.fetch).toHaveBeenCalledWith("/api/associations");
		await waitFor(() => {
			expect(screen.getByText("Asso 1")).toBeInTheDocument();
		});
	});

	it("opens add form when clicking add button", async () => {
		render(AdminPage);

		const addBtn = screen.getByText("➕ Ajouter Utilisateurs");
		await fireEvent.click(addBtn);

		expect(screen.getAllByRole("textbox").length).toBeGreaterThan(0);
		expect(screen.getByText("💾")).toBeInTheDocument();
		expect(screen.getByText("❌")).toBeInTheDocument();
	});

	it("cancels edit mode", async () => {
		render(AdminPage);

		const addBtn = screen.getByText("➕ Ajouter Utilisateurs");
		await fireEvent.click(addBtn);

		const cancelBtn = screen.getByText("❌");
		await fireEvent.click(cancelBtn);

		expect(screen.queryByText("💾")).not.toBeInTheDocument();
	});

	it("deletes a row", async () => {
		render(AdminPage);
		await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

		const deleteBtns = screen.getAllByText("🗑️");
		await fireEvent.click(deleteBtns[0]);

		expect(global.confirm).toHaveBeenCalled();
		expect(global.fetch).toHaveBeenCalledWith(
			"/api/users",
			expect.objectContaining({
				method: "DELETE",
			})
		);
	});

	it("saves a new row", async () => {
		render(AdminPage);

		const addBtn = screen.getByText("➕ Ajouter Utilisateurs");
		await fireEvent.click(addBtn);

		// Fill inputs (simplified, assuming inputs are present)
		// In a real test we might want to target specific inputs

		const saveBtn = screen.getByText("💾");
		await fireEvent.click(saveBtn);

		expect(global.fetch).toHaveBeenCalledWith(
			"/api/users",
			expect.objectContaining({
				method: "POST",
			})
		);
	});

	it("handles fetch error", async () => {
		vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));
		render(AdminPage);
		await waitFor(() => expect(screen.getByText("Network error")).toBeInTheDocument());
	});

	it("toggles event submission", async () => {
		render(AdminPage);

		// Wait for config to load (checkbox should be checked based on mockConfig)
		await waitFor(() => {
			const eventsTab = screen.getByText("Événements");
			expect(eventsTab).toBeInTheDocument();
		});

		const eventsTab = screen.getByText("Événements");
		await fireEvent.click(eventsTab);

		const toggle = screen.getByLabelText("Soumission d'événements ouverte");
		await waitFor(() => expect(toggle).toBeChecked());

		await fireEvent.click(toggle);

		expect(global.fetch).toHaveBeenCalledWith(
			"/api/config",
			expect.objectContaining({
				method: "POST",
				body: expect.stringContaining('"value":false'),
			})
		);
	});

	it("edits an existing row", async () => {
		render(AdminPage);
		await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

		const editBtns = screen.getAllByText("✏️");
		await fireEvent.click(editBtns[0]);

		const saveBtn = screen.getByText("💾");
		await fireEvent.click(saveBtn);

		expect(global.fetch).toHaveBeenCalledWith(
			"/api/users",
			expect.objectContaining({
				method: "PUT",
			})
		);
	});

	it("handles save error", async () => {
		render(AdminPage);
		await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

		const editBtns = screen.getAllByText("✏️");
		await fireEvent.click(editBtns[0]);

		vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as any);

		const saveBtn = screen.getByText("💾");
		await fireEvent.click(saveBtn);

		expect(global.alert).toHaveBeenCalledWith(expect.stringContaining("Erreur"));
	});

	it("handles delete error", async () => {
		render(AdminPage);
		await waitFor(() => expect(screen.getByText("John")).toBeInTheDocument());

		vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as any);

		const deleteBtns = screen.getAllByText("🗑️");
		await fireEvent.click(deleteBtns[0]);

		expect(global.alert).toHaveBeenCalledWith(expect.stringContaining("Erreur"));
	});

	it("formats values correctly", async () => {
		const mockData = [
			{ id: 1, bool: true, date: "2023-01-01T12:00:00.000Z", perm: 3, nullVal: null },
		];

		// Override fetch for a custom table test or just check existing format logic
		// Since we can't easily inject a custom table config, we'll test with existing tables that have these types
		// Users table has permissions
		// Events table has dates and booleans

		vi.mocked(global.fetch).mockImplementation((url) => {
			const urlStr = url.toString();
			if (urlStr.includes("/api/events")) {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve([
							{
								id: 1,
								title: "Event",
								start_date: "2023-01-01T12:00:00.000Z",
								validated: true,
								association_id: 1,
							},
						]),
				} as Response);
			}
			return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response);
		});

		render(AdminPage);
		const eventsTab = screen.getByText("Événements");
		await fireEvent.click(eventsTab);

		await waitFor(() => {
			expect(screen.getByText("✓")).toBeInTheDocument(); // Boolean true
			expect(screen.getByText(/01\/01\/2023/)).toBeInTheDocument(); // Date
		});
	});

	it("handles members table with all relation selects", async () => {
		const membersData = [
			{
				id: 1,
				user_id: 101,
				association_id: 201,
				list_id: 301,
				role_id: 401,
				visible: true,
				first_name: "John",
				last_name: "Doe",
				association_name: "Assoc A",
				list_name: "List A",
				role_name: "Role A",
			},
		];

		vi.mocked(global.fetch).mockImplementation(async (url) => {
			const urlStr = url.toString();
			if (urlStr.endsWith("/api/members")) {
				return {
					ok: true,
					json: async () => membersData,
				} as Response;
			}
			if (urlStr.endsWith("/api/associations")) {
				return {
					ok: true,
					json: async () => [{ id: 201, name: "Assoc A" }],
				} as Response;
			}
			if (urlStr.endsWith("/api/users")) {
				return {
					ok: true,
					json: async () => [{ id: 101, first_name: "John", last_name: "Doe" }],
				} as Response;
			}
			if (urlStr.endsWith("/api/roles")) {
				return {
					ok: true,
					json: async () => [{ id: 401, name: "Role A" }],
				} as Response;
			}
			if (urlStr.endsWith("/api/lists")) {
				return {
					ok: true,
					json: async () => [{ id: 301, name: "List A" }],
				} as Response;
			}
			if (urlStr.endsWith("/api/config")) {
				return {
					ok: true,
					json: async () => ({ event_submission_open: "false" }),
				} as Response;
			}
			return {
				ok: true,
				json: async () => [],
			} as Response;
		});

		render(AdminPage);

		// Switch to members tab
		const membersTab = screen.getByText("Membres");
		await fireEvent.click(membersTab);

		await waitFor(() => {
			expect(screen.getByText("John")).toBeInTheDocument();
		});

		// Click edit to show the form with selects
		const editButtons = screen.getAllByText("✏️");
		await fireEvent.click(editButtons[0]);

		// Check if selects are present and populated
		// We look for the selects by their value or by finding the option
		await waitFor(() => {
			expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
		});
		const userSelect = screen.getByDisplayValue("John Doe");
		expect(userSelect.tagName).toBe("SELECT");

		await waitFor(() => {
			expect(screen.getByDisplayValue("Assoc A")).toBeInTheDocument();
		});
		const assocSelect = screen.getByDisplayValue("Assoc A");
		expect(assocSelect.tagName).toBe("SELECT");

		await waitFor(() => {
			expect(screen.getByDisplayValue("List A")).toBeInTheDocument();
		});
		const listSelect = screen.getByDisplayValue("List A");
		expect(listSelect.tagName).toBe("SELECT");

		await waitFor(() => {
			expect(screen.getByDisplayValue("Role A")).toBeInTheDocument();
		});
		const roleSelect = screen.getByDisplayValue("Role A");
		expect(roleSelect.tagName).toBe("SELECT");

		// Check checkbox for visible
		const visibleCheckbox = screen.getAllByRole("checkbox")[0]; // The first one should be the visible toggle in the edit row
		expect(visibleCheckbox).toBeChecked();

		// Cancel edit
		const cancelButton = screen.getByText("❌");
		await fireEvent.click(cancelButton);
	});
});
