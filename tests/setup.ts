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
