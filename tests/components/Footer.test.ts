import { render, screen } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import Footer from "../../src/routes/Footer.svelte";

describe("Footer", () => {
	it("renders the current year", () => {
		render(Footer);
		const currentYear = new Date().getFullYear().toString();
		// Use getAllByText and check if at least one contains the copyright format
		const elements = screen.getAllByText(new RegExp(currentYear));
		const copyrightElement = elements.find((el) => el.textContent?.includes(`© ${currentYear}`));
		expect(copyrightElement).toBeInTheDocument();
	});

	it("renders the developer names", () => {
		render(Footer);
		expect(screen.getByText(/Léon Muselli/)).toBeInTheDocument();
		expect(screen.getByText(/Mathieu Daussin/)).toBeInTheDocument();
	});

	it("contains a link to email", () => {
		render(Footer);
		const link = screen.getByRole("link", { name: /Léon Muselli/ });
		expect(link).toHaveAttribute("href", "mailto:leon.muselli@etu.emse.fr");
	});
});
