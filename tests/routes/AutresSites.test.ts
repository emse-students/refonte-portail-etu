import { render, screen } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import AutresSitesPage from "../../src/routes/autres-sites/+page.svelte";

// Mock data
vi.mock("../../src/lib/data/autres-sites.json", () => ({
	default: [
		{ name: "Site 1", url: "https://site1.com", icon: "icon1.png", description: "Description 1" },
		{ name: "Site 2", url: "https://site2.com", icon: "icon2.png", description: "Description 2" },
	],
}));

// Mock $app/paths
vi.mock("$app/paths", () => ({
	asset: (path: string) => `/assets/${path}`,
}));

describe("Autres Sites Page", () => {
	it("renders page title and description", () => {
		render(AutresSitesPage);
		expect(screen.getByRole("heading", { name: "Autres Sites Utiles" })).toBeInTheDocument();
		expect(screen.getByText(/Explorez une sélection de sites web/)).toBeInTheDocument();
	});

	it("renders site cards", () => {
		render(AutresSitesPage);

		expect(screen.getByText("Site 1")).toBeInTheDocument();
		expect(screen.getByText("Description 1")).toBeInTheDocument();
		expect(screen.getByText("Site 2")).toBeInTheDocument();
		expect(screen.getByText("Description 2")).toBeInTheDocument();
	});

	it("renders links with correct attributes", () => {
		render(AutresSitesPage);

		const link1 = screen.getByRole("link", { name: /Site 1/ });
		expect(link1).toHaveAttribute("href", "https://site1.com");
		expect(link1).toHaveAttribute("target", "_blank");
		expect(link1).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("renders icons with correct src", () => {
		render(AutresSitesPage);

		const icon1 = screen.getByAltText("Site 1 logo");
		expect(icon1).toHaveAttribute("src", "/assets/icon1.png");
	});
});
