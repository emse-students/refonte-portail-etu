import { describe, it, expect, vi } from "vitest";
import { handle } from "$lib/server/auth";
import { SvelteKitAuth } from "@auth/sveltekit";

// Mock environment variables
vi.mock("$env/dynamic/private", () => ({
	env: {
		AUTH_CLIENT_ID: "mock-client-id",
		AUTH_CLIENT_SECRET: "mock-client-secret",
		AUTH_SECRET: "mock-secret",
	},
}));

// Mock @auth/sveltekit
vi.mock("@auth/sveltekit", () => ({
	SvelteKitAuth: vi.fn(() => ({
		handle: vi.fn(),
	})),
}));

describe("Auth Configuration", () => {
	it("should initialize SvelteKitAuth with correct configuration", async () => {
		// Re-import to trigger the SvelteKitAuth call
		await import("$lib/server/auth");

		expect(SvelteKitAuth).toHaveBeenCalledWith(
			expect.objectContaining({
				providers: expect.arrayContaining([
					expect.objectContaining({
						id: "cas-emse",
						type: "oidc",
						issuer: "https://cas.emse.fr/cas/oidc",
						clientId: "mock-client-id",
						clientSecret: "mock-client-secret",
					}),
				]),
				secret: "mock-secret",
				trustHost: true,
			})
		);
	});

	it("should have jwt callback that processes user profile", async () => {
		// Get the config passed to SvelteKitAuth
		const config = (SvelteKitAuth as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
		const jwtCallback = config.callbacks.jwt;

		const token = {};
		const user = { id: "user1" };
		const profile = { sub: "sub1" };

		const result = await jwtCallback({ token, user, profile });

		expect(result.id).toBe("sub1");
	});

	it("should have session callback that populates user session", async () => {
		const config = (SvelteKitAuth as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
		const sessionCallback = config.callbacks.session;

		const session = { user: {} };
		const token = { id: "sub1", email: "test@test.com", name: "Test User" };

		const result = await sessionCallback({ session, token });

		expect(result.user.id).toBe("sub1");
		expect(result.user.email).toBe("test@test.com");
		expect(result.user.name).toBe("Test User");
	});
});
