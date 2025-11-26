import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EventForm from "$lib/components/EventForm.svelte";
import type { Association, List, RawEvent } from "$lib/databasetypes";

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

describe("EventForm Component", () => {
	const mockAssociations: Association[] = [
		{ id: 1, name: "Asso 1", handle: "asso1", description: "", icon: "", color: 0, members: [] },
	];
	const mockLists: List[] = [
		{
			id: 1,
			name: "List 1",
			handle: "list1",
			description: "",
			icon: "",
			color: 0,
			promo: 2024,
			association_id: 1,
			members: [],
		},
	];

	const defaultProps = {
		associations: mockAssociations,
		lists: mockLists,
		onClose: vi.fn(),
		onSuccess: vi.fn(),
		isOpen: true,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockResolvedValue({
			ok: true,
			json: async () => ({ success: true }),
		});
	});

	it("renders form fields", () => {
		render(EventForm, defaultProps);

		expect(screen.getByLabelText("Titre")).toBeInTheDocument();
		expect(screen.getByLabelText("Description")).toBeInTheDocument();
		expect(screen.getByLabelText("Début")).toBeInTheDocument();
		expect(screen.getByLabelText("Fin")).toBeInTheDocument();
		expect(screen.getByLabelText("Lieu")).toBeInTheDocument();
	});

	it("submits form with correct data", async () => {
		render(EventForm, defaultProps);

		// Select association
		const assoRadio = screen.getByRole("radio", { name: "Association" });
		await fireEvent.click(assoRadio);

		const assoSelect = screen.getByRole("combobox", { name: "Association" });
		await fireEvent.change(assoSelect, { target: { value: "1" } });

		// Fill fields
		await fireEvent.input(screen.getByLabelText("Titre"), { target: { value: "New Event" } });
		await fireEvent.input(screen.getByLabelText("Description"), { target: { value: "Desc" } });
		await fireEvent.input(screen.getByLabelText("Lieu"), { target: { value: "Loc" } });

		// Dates are tricky with datetime-local, let's assume defaults or set them if needed.
		// The component sets defaults if initialDate is not provided, but let's set them to be sure.
		const startDate = "2023-01-01T10:00";
		const endDate = "2023-01-01T12:00";
		await fireEvent.input(screen.getByLabelText("Début"), { target: { value: startDate } });
		await fireEvent.input(screen.getByLabelText("Fin"), { target: { value: endDate } });

		// Submit
		const submitButton = screen.getByText("Proposer");
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/events",
				expect.objectContaining({
					method: "POST",
					body: expect.stringContaining("New Event"),
				})
			);
		});

		expect(defaultProps.onSuccess).toHaveBeenCalled();
		expect(defaultProps.onClose).toHaveBeenCalled();
	});

	it("handles edit mode", async () => {
		const mockEvent: RawEvent = {
			id: 1,
			title: "Existing Event",
			start_date: new Date("2023-01-01T10:00:00"),
			end_date: new Date("2023-01-01T12:00:00"),
			description: "Desc",
			location: "Loc",
			validated: true,
			created_at: new Date(),
			edited_at: new Date(),
			association_id: 1,
			list_id: null,
		};

		render(EventForm, { ...defaultProps, event: mockEvent });

		expect(screen.getByDisplayValue("Existing Event")).toBeInTheDocument();
		expect(screen.getByText("Modifier")).toBeInTheDocument();

		// Submit
		const submitButton = screen.getByText("Modifier");
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/events",
				expect.objectContaining({
					method: "PUT",
					body: expect.stringContaining("Existing Event"),
				})
			);
		});
	});

	it("handles delete", async () => {
		const mockEvent: RawEvent = {
			id: 1,
			title: "Existing Event",
			start_date: new Date(),
			end_date: new Date(),
			description: "",
			location: "",
			validated: true,
			created_at: new Date(),
			edited_at: new Date(),
			association_id: 1,
			list_id: null,
		};

		render(EventForm, { ...defaultProps, event: mockEvent });

		const deleteButtons = screen.getAllByText("Supprimer");
		await fireEvent.click(deleteButtons[0]); // Click the main delete button

		// Confirm modal should appear
		expect(screen.getByText("Confirmer la suppression")).toBeInTheDocument();

		const confirmButtons = screen.getAllByText("Supprimer");
		// The last one should be the confirm button in the modal
		await fireEvent.click(confirmButtons[confirmButtons.length - 1]);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/events",
				expect.objectContaining({
					method: "DELETE",
					body: JSON.stringify({ id: 1 }),
				})
			);
		});
	});
});
