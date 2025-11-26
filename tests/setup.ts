import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/svelte";
import { afterEach, vi } from "vitest";

// Mock svelte/transition to avoid waiting for animations
vi.mock("svelte/transition", () => ({
	fade: (node: Element, params: any) => ({ duration: 0 }),
	scale: (node: Element, params: any) => ({ duration: 0 }),
	slide: (node: Element, params: any) => ({ duration: 0 }),
	fly: (node: Element, params: any) => ({ duration: 0 }),
}));

afterEach(() => {
	cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock $app/navigation
vi.mock("$app/navigation", () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
}));

// Mock $app/stores
vi.mock("$app/stores", () => {
	const { readable, writable } = require("svelte/store");
	return {
		getStores: () => ({
			page: readable({
				url: new URL("http://localhost"),
				params: {},
				route: { id: null },
				status: 200,
				error: null,
				data: {},
				form: null,
			}),
			navigating: readable(null),
			updated: readable(false),
		}),
		page: readable({
			url: new URL("http://localhost"),
			params: {},
			route: { id: null },
			status: 200,
			error: null,
			data: {},
			form: null,
		}),
		navigating: readable(null),
		updated: readable(false),
	};
});
