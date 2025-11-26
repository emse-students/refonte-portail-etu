import { render, screen } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import PartenariatsPage from "../../src/routes/partenariats/+page.svelte";

// Mock data
vi.mock("../../src/lib/data/partenariats.json", () => ({
	default: [{ name: "Partner 1" }, { name: "Partner 2" }],
}));

describe("Partenariats Page", () => {
	it("renders page title and description", () => {
		render(PartenariatsPage);
		expect(screen.getByRole("heading", { name: "Nos Partenariats" })).toBeInTheDocument();
		expect(screen.getByText(/Nous sommes fiers de collaborer/)).toBeInTheDocument();
	});

	it("renders partner cards", async () => {
		render(PartenariatsPage);

		// Wait for onMount to process the logos
		const partner1 = await screen.findByText("Partner 1");
		const partner2 = await screen.findByText("Partner 2");

		expect(partner1).toBeInTheDocument();
		expect(partner2).toBeInTheDocument();
	});

	it("renders logos with correct alt text", async () => {
		render(PartenariatsPage);

		const logo1 = await screen.findByAltText("Logo de Partner 1");
		expect(logo1).toBeInTheDocument();
		expect(logo1).toHaveAttribute("src", expect.stringContaining("Partner%201"));
	});
});
