import { render, screen } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import AssociationCard from "../../src/lib/components/AssociationCard.svelte";
import type { Association } from "../../src/lib/databasetypes";

// Mock $app/paths
vi.mock("$app/paths", () => ({
	resolve: (path: string) => path,
	asset: (path: string) => path,
}));

describe("AssociationCard Component", () => {
	const mockAssociation: Association = {
		id: 1,
		name: "Test Association",
		handle: "test-asso",
		description: "A test association",
		icon: "/images/test-logo.png",
		members: [],
		color: 0xff0000,
	};

	it("should render association name", () => {
		render(AssociationCard, { association: mockAssociation });
		expect(screen.getByText("Test Association")).toBeInTheDocument();
	});

	it("should render association logo when icon is present", () => {
		render(AssociationCard, { association: mockAssociation });
		const img = screen.getByAltText("Test Association logo");
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute("src", "/images/test-logo.png");
	});

	it("should render placeholder when icon is missing", () => {
		const associationWithoutIcon = { ...mockAssociation, icon: "" };
		render(AssociationCard, { association: associationWithoutIcon });

		// Should not find the image
		expect(screen.queryByAltText("Test Association logo")).not.toBeInTheDocument();

		// Should find the placeholder text (first letter of name)
		expect(screen.getByText("T")).toBeInTheDocument();
	});

	it("should have correct link to association page", () => {
		render(AssociationCard, { association: mockAssociation });
		const link = screen.getByRole("link", { name: /Voir les détails de Test Association/i });
		expect(link).toHaveAttribute("href", "/associations/test-asso");
	});
});
