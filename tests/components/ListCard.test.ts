import { render, screen } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ListCard from "$lib/components/ListCard.svelte";

// Mock $app/paths
vi.mock("$app/paths", () => ({
	resolve: (path: string) => path,
	asset: (path: string) => path,
}));

describe("ListCard Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders list name", () => {
		const list = {
			id: 1,
			name: "Test List",
			handle: "test-list",
			association_id: 1,
			description: "A test list",
			icon: null,
			promo: 2024,
			color: 0,
			members: [],
		};

		render(ListCard, { props: { list } });

		expect(screen.getByText("Test List")).toBeInTheDocument();
	});

	it("renders list with icon", () => {
		const list = {
			id: 1,
			name: "List With Icon",
			handle: "list-icon",
			association_id: 1,
			description: "",
			icon: 17,
			promo: 2024,
			color: 0,
			members: [],
		};

		render(ListCard, { props: { list } });

		const img = screen.getByAltText("List With Icon logo");
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute("src", "/api/image/17");
	});

	it("renders placeholder when no icon", () => {
		const list = {
			id: 1,
			name: "No Icon List",
			handle: "no-icon",
			association_id: 1,
			description: "",
			icon: null,
			promo: 2024,
			color: 0,
			members: [],
		};

		render(ListCard, { props: { list } });

		// Placeholder shows first letter
		expect(screen.getByText("N")).toBeInTheDocument();
	});

	it("renders link to list page", () => {
		const list = {
			id: 1,
			name: "Linked List",
			handle: "linked-list",
			association_id: 1,
			description: "",
			icon: null,
			promo: 2024,
			color: 0,
			members: [],
		};

		render(ListCard, { props: { list } });

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/lists/linked-list");
	});

	it("renders association name when provided", () => {
		const list = {
			id: 1,
			name: "Associated List",
			handle: "assoc-list",
			association_id: 1,
			description: "",
			icon: null,
			promo: 2024,
			color: 0,
			association_name: "Parent Association",
			members: [],
		};

		render(ListCard, { props: { list } });

		expect(screen.getByText("Parent Association")).toBeInTheDocument();
	});

	it("does not render association name when not provided", () => {
		const list = {
			id: 1,
			name: "Standalone List",
			handle: "standalone",
			association_id: 1,
			description: "",
			icon: null,
			promo: 2024,
			color: 0,
			members: [],
		};

		render(ListCard, { props: { list } });

		expect(screen.queryByText("Parent Association")).not.toBeInTheDocument();
	});

	it("has correct aria-label", () => {
		const list = {
			id: 1,
			name: "BDE",
			handle: "bde",
			association_id: 1,
			description: "",
			icon: null,
			promo: 2024,
			color: 0,
			members: [],
		};

		render(ListCard, { props: { list } });

		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("aria-label", "Voir les détails de BDE");
	});

	it("renders empty icon as placeholder", () => {
		const list = {
			id: 1,
			name: "Empty Icon",
			handle: "empty-icon",
			association_id: 1,
			description: "",
			icon: null,
			promo: 2024,
			color: 0,
			members: [],
		};

		render(ListCard, { props: { list } });

		// Empty string is falsy, so placeholder should show
		expect(screen.getByText("E")).toBeInTheDocument();
	});

	it("renders list card container", () => {
		const list = {
			id: 1,
			name: "Container Test",
			handle: "container",
			association_id: 1,
			description: "",
			icon: null,
			promo: 2024,
			color: 0,
			members: [],
		};

		render(ListCard, { props: { list } });

		expect(document.querySelector(".list-card")).toBeInTheDocument();
	});

	it("handles special characters in list name", () => {
		const list = {
			id: 1,
			name: "L'Association",
			handle: "l-association",
			association_id: 1,
			description: "",
			icon: null,
			promo: 2024,
			color: 0,
			members: [],
		};

		render(ListCard, { props: { list } });

		expect(screen.getByText("L'Association")).toBeInTheDocument();
		expect(screen.getByText("L")).toBeInTheDocument(); // Placeholder
	});
});
