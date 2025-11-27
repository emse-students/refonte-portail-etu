import { describe, it, expect, vi, beforeEach } from "vitest";
import { load } from "../../src/routes/+layout.server";

describe("+layout.server.ts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns session and userData from locals", async () => {
		const mockSession = {
			user: { name: "Test User", email: "test@test.com" },
			access_token: "token123",
		};
		const mockUserData = {
			id: 1,
			first_name: "Test",
			last_name: "User",
			permissions: 0,
			memberships: [],
		};

		const result = (await load({
			locals: {
				session: mockSession,
				userData: mockUserData,
			},
		} as any)) as any;

		expect(result.session).toBe(mockSession);
		expect(result.userData).toBe(mockUserData);
	});

	it("returns null session when not authenticated", async () => {
		const result = (await load({
			locals: {
				session: null,
				userData: null,
			},
		} as any)) as any;

		expect(result.session).toBeNull();
		expect(result.userData).toBeNull();
	});

	it("returns session with userData having permissions", async () => {
		const mockSession = { user: { name: "Admin" } };
		const mockUserData = {
			id: 1,
			permissions: 255,
			memberships: [{ association_id: 1, role: { permissions: 15 } }],
		};

		const result = (await load({
			locals: {
				session: mockSession,
				userData: mockUserData,
			},
		} as any)) as any;

		expect(result.session).toEqual(mockSession);
		expect(result.userData.permissions).toBe(255);
		expect(result.userData.memberships).toHaveLength(1);
	});

	it("handles undefined locals gracefully", async () => {
		const result = (await load({
			locals: {},
		} as any)) as any;

		expect(result.session).toBeUndefined();
		expect(result.userData).toBeUndefined();
	});

	it("preserves full session structure", async () => {
		const mockSession = {
			user: {
				name: "Full User",
				email: "full@test.com",
				image: "avatar.jpg",
			},
			access_token: "abc123",
			refresh_token: "xyz789",
			expires_at: 1234567890,
		};

		const result = (await load({
			locals: {
				session: mockSession,
				userData: null,
			},
		} as any)) as any;

		expect(result.session).toEqual(mockSession);
		expect(result.session.user.email).toBe("full@test.com");
		expect(result.session.access_token).toBe("abc123");
	});

	it("preserves full userData structure", async () => {
		const mockUserData = {
			id: 42,
			first_name: "John",
			last_name: "Doe",
			login: "johndoe",
			email: "john@test.com",
			permissions: 127,
			promo: 2024,
			memberships: [
				{
					association_id: 1,
					list_id: null,
					role: { id: 1, name: "Admin", permissions: 255 },
				},
				{
					association_id: null,
					list_id: 2,
					role: { id: 2, name: "Member", permissions: 1 },
				},
			],
		};

		const result = (await load({
			locals: {
				session: { user: {} },
				userData: mockUserData,
			},
		} as any)) as any;

		expect(result.userData).toEqual(mockUserData);
		expect(result.userData.memberships).toHaveLength(2);
		expect(result.userData.login).toBe("johndoe");
	});
});
