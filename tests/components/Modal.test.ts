import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import ModalTestWrapper from "./ModalTestWrapper.svelte";

describe("Modal Component", () => {
	it("should not render when open is false", () => {
		render(ModalTestWrapper, { open: false, title: "Test Modal" });
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("should render when open is true", () => {
		render(ModalTestWrapper, { open: true, title: "Test Modal" });
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Test Modal")).toBeInTheDocument();
		expect(screen.getByText("Modal Content")).toBeInTheDocument();
	});

	it("should close when clicking the close button", async () => {
		const { component } = render(ModalTestWrapper, { open: true, title: "Test Modal" });
		const closeBtn = screen.getByLabelText("Fermer");
		await fireEvent.click(closeBtn);

		// We need to wait for the DOM update
		// Since we mocked transitions to 0 duration, it should be quick.
		// However, the wrapper updates the 'open' prop.
		// We can check if the dialog is gone.
		await screen.findByRole("dialog", {}, { timeout: 100 }).catch(() => {});
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("should close when clicking the backdrop", async () => {
		render(ModalTestWrapper, { open: true, title: "Test Modal" });
		// The backdrop is the outer div with class modal-backdrop
		// It has an onclick handler.
		// We can find it by class or generic query.
		// It doesn't have a role, but it contains the dialog.
		// Let's add a test-id or find by class if possible, but TL prefers roles.
		// The backdrop is the parent of the dialog.
		const dialog = screen.getByRole("dialog");
		const backdrop = dialog.parentElement;

		if (backdrop) {
			await fireEvent.click(backdrop);
			await screen.findByRole("dialog", {}, { timeout: 100 }).catch(() => {});
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		} else {
			throw new Error("Backdrop not found");
		}
	});

	it("should close when pressing Escape", async () => {
		render(ModalTestWrapper, { open: true, title: "Test Modal" });
		await fireEvent.keyDown(window, { key: "Escape" });
		await screen.findByRole("dialog", {}, { timeout: 100 }).catch(() => {});
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
