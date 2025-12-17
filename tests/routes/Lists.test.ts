import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ListsPage from "../../src/routes/lists/+page.svelte";
import ListCardMock from "../mocks/ListCardMock.svelte";

// Mock ListCard component
vi.mock("../../src/lib/components/ListCard.svelte", async () => {
	const ListCardMock = await import("../mocks/ListCardMock.svelte");
	return {
		default: ListCardMock.default,
	};
});

describe("Lists Page", () => {
	const mockLists = [
		{ id: 1, name: "Liste 1", promo: 2025, association_name: "BDE" },
		{ id: 2, name: "Liste 2", promo: 2025, association_name: "BDS" },
		{ id: 3, name: "Liste 3", promo: 2024, association_name: "BDE" },
	] as any;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders page title and description", () => {
		render(ListsPage, { data: { lists: mockLists } } as any);
		expect(screen.getByText("Listes étudiantes")).toBeInTheDocument();
		expect(screen.getByText(/Engagez-vous/)).toBeInTheDocument();
	});

	it("renders promo headers", () => {
		render(ListsPage, { data: { lists: mockLists } } as any);
		expect(screen.getByText("Campagnes 2025")).toBeInTheDocument();
		expect(screen.getByText("Campagnes 2024")).toBeInTheDocument();
	});

	it("renders list cards for open promos", () => {
		render(ListsPage, { data: { lists: mockLists } } as any);
		// By default, all promos are open
		const cards = screen.getAllByTestId("list-card-mock");
		expect(cards).toHaveLength(3);
	});

	it("toggles promo section", async () => {
		render(ListsPage, { data: { lists: mockLists } } as any);

		const promo2025Header = screen.getByRole("button", { name: /Campagnes 2025/ });

		// Close 2025 section
		await fireEvent.click(promo2025Header);

		// Should only see 1 card (from 2024)
		const cardsAfterClose = screen.getAllByTestId("list-card-mock");
		expect(cardsAfterClose).toHaveLength(1);

		// Open 2025 section
		await fireEvent.click(promo2025Header);

		// Should see all 3 cards again
		const cardsAfterOpen = screen.getAllByTestId("list-card-mock");
		expect(cardsAfterOpen).toHaveLength(3);
	});
});
