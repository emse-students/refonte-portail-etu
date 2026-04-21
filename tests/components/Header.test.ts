import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Header from "../../src/routes/Header.svelte";

// Mock $app/navigation
vi.mock("$app/navigation", () => ({
	pushState: vi.fn(),
	goto: vi.fn(),
}));

// Mock $app/paths
vi.mock("$app/paths", () => ({
	asset: (path: string) => path,
	resolve: (path: string) => path,
}));

// Mock $app/state
vi.mock("$app/state", () => ({
	page: {
		url: { pathname: "/" },
		state: {},
	},
}));

describe("Header", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders logo and title", () => {
		render(Header, { userData: null });
		expect(screen.getByAltText("Logo BDE EMSE")).toBeInTheDocument();
		expect(screen.getByText("Portail Étudiant")).toBeInTheDocument();
	});

	it("renders navigation links", () => {
		render(Header, { userData: null });
		expect(screen.getByText("Accueil")).toBeInTheDocument();
		expect(screen.getByText("Associations")).toBeInTheDocument();
		expect(screen.getByText("Listes")).toBeInTheDocument();
		expect(screen.getByText("Autres sites")).toBeInTheDocument();
		expect(screen.getByText("Partenariats")).toBeInTheDocument();
	});

	it("renders login button when user is not logged in", () => {
		render(Header, { userData: null });
		const loginBtn = screen.getByText("Se connecter");
		expect(loginBtn).toBeInTheDocument();
		expect(loginBtn.closest("a")?.getAttribute("href") || loginBtn.getAttribute("href")).toBe(
			"/auth/signin"
		);
	});

	it("renders logout button when user is logged in", () => {
		render(Header, { userData: { first_name: "Test", last_name: "User" } });
		const logoutBtn = screen.getByText("Se déconnecter");
		expect(logoutBtn).toBeInTheDocument();
	});

	it("uses native signin route", async () => {
		render(Header, { userData: null });
		const loginBtn = screen.getByText("Se connecter");
		await fireEvent.click(loginBtn);
		expect(loginBtn.closest("a")?.getAttribute("href") || loginBtn.getAttribute("href")).toBe(
			"/auth/signin"
		);
	});

	it("uses native signout form", async () => {
		render(Header, { userData: { first_name: "Test", last_name: "User" } });
		const logoutBtn = screen.getByText("Se déconnecter");
		await fireEvent.click(logoutBtn);
		expect(logoutBtn.closest("form")?.getAttribute("action")).toBe("/auth/signout");
		expect(logoutBtn.closest("form")?.getAttribute("method")?.toLowerCase()).toBe("post");
	});
});
