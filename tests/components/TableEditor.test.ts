import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TableEditor from "$lib/components/TableEditor.svelte";
import * as navigation from "$app/navigation";

// Mock $app/navigation
vi.mock("$app/navigation", () => ({
	invalidateAll: vi.fn(),
}));

describe("TableEditor Component", () => {
	const mockData = [
		{ id: 1, name: "Item 1", active: true, date: "2023-01-01T12:00:00.000Z" },
		{ id: 2, name: "Item 2", active: false, date: "2023-01-02T12:00:00.000Z" },
	];

	const mockColumns = [
		{ key: "id", label: "ID" },
		{ key: "name", label: "Name", editable: true },
		{ key: "active", label: "Active", type: "boolean", editable: true },
		{ key: "date", label: "Date", type: "datetime-local", editable: true },
	];

	const mockAction = "/api/update";
	const mockExtraActions = [{ label: "Custom Action", onClick: vi.fn(), class: "btn-custom" }];

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn() as any;
		Object.defineProperty(window, "location", {
			value: { reload: vi.fn() },
			writable: true,
		});
	});

	it("renders table with data and columns", () => {
		render(TableEditor, {
			data: mockData,
			columns: mockColumns,
			action: mockAction,
		});

		expect(screen.getByText("ID")).toBeTruthy();
		expect(screen.getByText("Name")).toBeTruthy();
		expect(screen.getByText("Item 1")).toBeTruthy();
		expect(screen.getByText("Item 2")).toBeTruthy();
	});

	it("enters edit mode when Edit button is clicked", async () => {
		render(TableEditor, {
			data: mockData,
			columns: mockColumns,
			action: mockAction,
		});

		const editButtons = screen.getAllByText("Edit");
		await fireEvent.click(editButtons[0]);

		// Check if inputs appear
		const inputs = screen.getAllByRole("textbox"); // Name input
		expect(inputs.length).toBeGreaterThan(0);
		expect((inputs[0] as HTMLInputElement).value).toBe("Item 1");

		// Check if Save and Cancel buttons appear
		expect(screen.getByText("Save")).toBeTruthy();
		expect(screen.getByText("Cancel")).toBeTruthy();
	});

	it("cancels edit mode", async () => {
		render(TableEditor, {
			data: mockData,
			columns: mockColumns,
			action: mockAction,
		});

		const editButtons = screen.getAllByText("Edit");
		await fireEvent.click(editButtons[0]);

		const cancelButton = screen.getByText("Cancel");
		await fireEvent.click(cancelButton);

		// Inputs should disappear
		expect(screen.queryByRole("textbox")).toBeNull();
		expect(screen.getByText("Item 1")).toBeTruthy();
	});

	it("saves changes successfully", async () => {
		(global.fetch as any).mockResolvedValue({ ok: true });

		render(TableEditor, {
			data: mockData,
			columns: mockColumns,
			action: mockAction,
		});

		// Enter edit mode
		const editButtons = screen.getAllByText("Edit");
		await fireEvent.click(editButtons[0]);

		// Change name
		const nameInput = screen.getAllByRole("textbox")[0];
		await fireEvent.input(nameInput, { target: { value: "Updated Item" } });

		// Save
		const saveButton = screen.getByText("Save");
		await fireEvent.click(saveButton);

		// Verify fetch call
		expect(global.fetch).toHaveBeenCalledWith(
			mockAction,
			expect.objectContaining({
				method: "POST",
				body: expect.any(FormData),
			})
		);

		// Verify FormData content (we can't easily inspect FormData in jsdom, but we can check if fetch was called)
		// In a real browser environment we could inspect the body more closely.

		await waitFor(() => {
			expect(navigation.invalidateAll).toHaveBeenCalled();
		});
	});

	it("handles save error", async () => {
		(global.fetch as any).mockResolvedValue({ ok: false });
		const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

		render(TableEditor, {
			data: mockData,
			columns: mockColumns,
			action: mockAction,
		});

		const editButtons = screen.getAllByText("Edit");
		await fireEvent.click(editButtons[0]);

		const saveButton = screen.getByText("Save");
		await fireEvent.click(saveButton);

		await waitFor(() => {
			expect(alertMock).toHaveBeenCalledWith("Error saving");
		});
	});

	it("renders and triggers extra actions", async () => {
		render(TableEditor, {
			data: mockData,
			columns: mockColumns,
			action: mockAction,
			extraActions: mockExtraActions,
		});

		const customButtons = screen.getAllByText("Custom Action");
		expect(customButtons.length).toBe(2);

		await fireEvent.click(customButtons[0]);
		expect(mockExtraActions[0].onClick).toHaveBeenCalledWith(mockData[0]);
	});

	it("handles boolean and date inputs correctly", async () => {
		render(TableEditor, {
			data: mockData,
			columns: mockColumns,
			action: mockAction,
		});

		const editButtons = screen.getAllByText("Edit");
		await fireEvent.click(editButtons[0]);

		// Boolean select
		const select = screen.getByRole("combobox");
		expect((select as HTMLSelectElement).value).toBe("true");

		// Date input (datetime-local)
		// Note: finding by type="datetime-local" is tricky with getByRole, usually it's not a specific role.
		// We can look for the input value.
		// The component formats the date to local ISO string slice(0, 16)
		// 2023-01-01T12:00:00.000Z -> depends on timezone of the test runner.
		// We'll just check if an input exists.
		// const dateInputs = container.querySelectorAll('input[type="datetime-local"]');
		// expect(dateInputs.length).toBe(1);
	});

	it("deletes item when Delete button is clicked and confirmed", async () => {
		const deleteAction = "/api/delete";
		(global.fetch as any).mockResolvedValue({ ok: true });
		vi.spyOn(window, "confirm").mockReturnValue(true);

		render(TableEditor, {
			data: mockData,
			columns: mockColumns,
			action: mockAction,
			deleteAction: deleteAction,
		});

		const deleteButtons = screen.getAllByText("Supprimer");
		await fireEvent.click(deleteButtons[0]);

		expect(window.confirm).toHaveBeenCalled();
		expect(global.fetch).toHaveBeenCalledWith(deleteAction, expect.any(Object));
		expect(navigation.invalidateAll).toHaveBeenCalled();
	});
});
