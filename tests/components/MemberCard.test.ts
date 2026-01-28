import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import MemberCard from "$lib/components/MemberCard.svelte";
import type { Member } from "$lib/databasetypes";

describe("MemberCard Component", () => {
	const mockMember: Member = {
		id: 1,
		visible: true,
		association_id: 1,
		list_id: null,
		user: {
			id: 1,
			first_name: "John",
			last_name: "Doe",
			email: "john.doe@example.com",
			login: "john.doe",
			promo: 2024,
		},
		role_name: "President",
		permissions: 0,
		hierarchy: 10,
	};

	it("should render member name and role", () => {
		render(MemberCard, { member: mockMember });

		expect(screen.getByText("John Doe")).toBeInTheDocument();
		expect(screen.getByText("President")).toBeInTheDocument();
		expect(screen.getByText("2024")).toBeInTheDocument();
	});

	it("should render initials in placeholder", () => {
		render(MemberCard, { member: mockMember });
		// The placeholder contains initials "JD"
		expect(screen.getByText("JD")).toBeInTheDocument();
	});

	it("should not show edit controls by default", () => {
		render(MemberCard, { member: mockMember });
		expect(screen.queryByText("Modifier")).not.toBeInTheDocument();
		expect(screen.queryByText("Retirer")).not.toBeInTheDocument();
	});

	it("should show edit controls when editMode is true", () => {
		render(MemberCard, { member: mockMember, editMode: true });
		expect(screen.getByText(/Modifier/)).toBeInTheDocument();
		expect(screen.getByText(/Retirer/)).toBeInTheDocument();
	});

	it("should fire events when buttons are clicked", async () => {
		const onRemove = vi.fn();
		const onEditMember = vi.fn();

		render(MemberCard, {
			member: mockMember,
			editMode: true,
			onRemove,
			onEditMember,
		});

		await fireEvent.click(screen.getByText("Retirer"));
		expect(onRemove).toHaveBeenCalledWith(mockMember.id);

		await fireEvent.click(screen.getByText("Modifier"));
		expect(onEditMember).toHaveBeenCalledWith(mockMember);
	});

	it("should apply bureau styles when isBureau is true", () => {
		const { container } = render(MemberCard, { member: mockMember, isBureau: true });
		// Check if the class 'bureau-card' is applied to the first div
		expect(container.firstChild).toHaveClass("bureau-card");
	});
});
