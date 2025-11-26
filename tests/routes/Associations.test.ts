import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AssociationsPage from "../../src/routes/associations/+page.svelte";
import AssociationCardMock from "../mocks/AssociationCardMock.svelte";

// Mock AssociationCard component
vi.mock("../../src/lib/components/AssociationCard.svelte", async () => {
	const AssociationCardMock = await import("../mocks/AssociationCardMock.svelte");
	return {
		default: AssociationCardMock.default,
	};
});

describe("Associations Page", () => {
	const mockAssociations = [
		{ id: 1, name: "BDE", description: "Bureau des Élèves" },
		{ id: 2, name: "BDS", description: "Bureau des Sports" },
		{ id: 3, name: "BDA", description: "Bureau des Arts" },
	] as any;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders page title and description", () => {
		render(AssociationsPage, { data: { associations: mockAssociations } } as any);
		expect(screen.getByText("La Vie Associative")).toBeInTheDocument();
		expect(screen.getByText(/Engagez-vous/)).toBeInTheDocument();
	});

	it("renders list of associations", () => {
		render(AssociationsPage, { data: { associations: mockAssociations } } as any);
		const cards = screen.getAllByTestId("association-card-mock");
		expect(cards).toHaveLength(3);
	});

	it("filters associations by name", async () => {
		render(AssociationsPage, { data: { associations: mockAssociations } } as any);
		const searchInput = screen.getByPlaceholderText("Rechercher une association...");
		await fireEvent.input(searchInput, { target: { value: "BDE" } });

		const cards = screen.getAllByTestId("association-card-mock");
		expect(cards).toHaveLength(1);
	});

	it("filters associations by description", async () => {
		render(AssociationsPage, { data: { associations: mockAssociations } } as any);
		const searchInput = screen.getByPlaceholderText("Rechercher une association...");
		await fireEvent.input(searchInput, { target: { value: "Sports" } });

		const cards = screen.getAllByTestId("association-card-mock");
		expect(cards).toHaveLength(1);
	});

	it("shows no results message when no match", async () => {
		render(AssociationsPage, { data: { associations: mockAssociations } } as any);
		const searchInput = screen.getByPlaceholderText("Rechercher une association...");
		await fireEvent.input(searchInput, { target: { value: "XYZ" } });

		expect(screen.getByText("Aucune association trouvée")).toBeInTheDocument();
		expect(screen.queryByTestId("association-card-mock")).not.toBeInTheDocument();
	});

	it("clears search query", async () => {
		render(AssociationsPage, { data: { associations: mockAssociations } } as any);
		const searchInput = screen.getByPlaceholderText("Rechercher une association...");
		await fireEvent.input(searchInput, { target: { value: "BDE" } });

		const clearBtn = screen.getByLabelText("Effacer la recherche");
		await fireEvent.click(clearBtn);

		expect(searchInput).toHaveValue("");
		const cards = screen.getAllByTestId("association-card-mock");
		expect(cards).toHaveLength(3);
	});
});
