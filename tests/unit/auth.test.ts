import { describe, it, expect, vi } from "vitest";
import {
	generateAuthorizationUrl,
	toSessionUser,
	getUserAuthIdentifiers,
	matchesUserAuthIdentifier,
} from "$lib/server/auth";
import type { RawUser } from "$lib/databasetypes";

vi.mock("$env/dynamic/private", () => ({
	env: {
		MICONNECT_ISSUER: "https://auth.example.test/oidc/",
		MICONNECT_CLIENT_ID: "client-id",
		MICONNECT_CLIENT_SECRET: "client-secret",
		AUTH_SECRET: "test-secret",
		PROD: "false",
	},
}));

describe("Native Auth Helpers", () => {
	it("builds authorization URL with expected OIDC parameters", () => {
		const url = generateAuthorizationUrl(
			"http://localhost:5173/auth/callback",
			"state-1",
			"nonce-1"
		);
		const parsed = new URL(url);

		expect(parsed.origin + parsed.pathname).toBe("https://auth.example.test/oidc/authorize/");
		expect(parsed.searchParams.get("client_id")).toBe("client-id");
		expect(parsed.searchParams.get("redirect_uri")).toBe("http://localhost:5173/auth/callback");
		expect(parsed.searchParams.get("state")).toBe("state-1");
		expect(parsed.searchParams.get("nonce")).toBe("nonce-1");
		expect(parsed.searchParams.get("scope")).toContain("openid");
	});

	it("maps DB user to session user with uid priority", () => {
		const dbUser = {
			id: 1,
			first_name: "John",
			last_name: "Doe",
			email: "john@example.com",
			login: "jdoe",
			uid: "authentik-uid-123",
			promo: 2025,
			admin: false,
			created_at: new Date(),
			edited_at: new Date(),
		} as RawUser;

		const sessionUser = toSessionUser(dbUser);
		expect(sessionUser.id).toBe("authentik-uid-123");
		expect(sessionUser.name).toBe("John Doe");
		expect(sessionUser.role).toBe("user");
	});

	it("returns uid then login as accepted auth identifiers", () => {
		const ids = getUserAuthIdentifiers({ uid: "uid-1", login: "legacy-login" });
		expect(ids).toEqual(["uid-1", "legacy-login"]);
	});

	it("accepts both uid and legacy login for session consistency", () => {
		const user = { uid: "uid-1", login: "legacy-login" };
		expect(matchesUserAuthIdentifier("uid-1", user)).toBe(true);
		expect(matchesUserAuthIdentifier("legacy-login", user)).toBe(true);
		expect(matchesUserAuthIdentifier("other", user)).toBe(false);
	});
});
