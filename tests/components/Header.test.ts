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

// Mock @auth/sveltekit/client
vi.mock("@auth/sveltekit/client", () => ({
	signIn: vi.fn(),
	signOut: vi.fn(),
}));

describe("Header", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders logo and title", () => {
		render(Header, { user: null });
		expect(screen.getByAltText("Logo BDE EMSE")).toBeInTheDocument();
		expect(screen.getByText("Portail des Étudiants")).toBeInTheDocument();
	});

	it("renders navigation links", () => {
		render(Header, { user: null });
		expect(screen.getByText("Accueil")).toBeInTheDocument();
		expect(screen.getByText("Associations")).toBeInTheDocument();
		expect(screen.getByText("Listes")).toBeInTheDocument();
		expect(screen.getByText("Autres Sites")).toBeInTheDocument();
		expect(screen.getByText("Partenariats")).toBeInTheDocument();
	});

	it("renders login button when user is not logged in", () => {
		render(Header, { user: null });
		const loginBtn = screen.getByText("Se connecter");
		expect(loginBtn).toBeInTheDocument();
	});

	it("renders logout button when user is logged in", () => {
		render(Header, { user: { name: "Test User" } });
		const logoutBtn = screen.getByText("Se déconnecter");
		expect(logoutBtn).toBeInTheDocument();
	});

	it("calls signIn when login button is clicked", async () => {
		const { signIn } = await import("@auth/sveltekit/client");
		render(Header, { user: null });
		const loginBtn = screen.getByText("Se connecter");
		await fireEvent.click(loginBtn);
		expect(signIn).toHaveBeenCalledWith("cas-emse");
	});

	it("calls signOut when logout button is clicked", async () => {
		const { signOut } = await import("@auth/sveltekit/client");
		render(Header, { user: { name: "Test User" } });
		const logoutBtn = screen.getByText("Se déconnecter");
		await fireEvent.click(logoutBtn);
		expect(signOut).toHaveBeenCalled();
	});
});
