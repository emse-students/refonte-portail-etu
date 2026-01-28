import { describe, it, expect, vi, beforeEach } from "vitest";
import { handle } from "../../src/hooks.server";
import * as sessionModule from "../../src/lib/server/session";
import db from "../../src/lib/server/database";
import logger from "../../src/lib/server/logger";
import Permission from "$lib/permissions";

// Mock dependencies
vi.mock("$lib/server/logger", () => ({
	default: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		warn: vi.fn(),
	},
}));

vi.mock("$lib/server/auth", () => ({
	handle: vi.fn(async ({ event, resolve }) => {
		// Simulate auth handle
		return resolve(event);
	}),
}));

vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
}));

vi.mock("$lib/server/session", () => ({
	getSessionData: vi.fn(),
	setSessionCookie: vi.fn(),
	clearSessionCookie: vi.fn(),
}));

// Mock sequence to execute handlers in order
vi.mock("@sveltejs/kit/hooks", () => ({
	sequence: (...handlers: any[]) => {
		return async ({ event, resolve }: any) => {
			const execute = async (index: number, evt: any): Promise<any> => {
				if (index >= handlers.length) return resolve(evt);
				return handlers[index]({
					event: evt,
					resolve: (e: any) => execute(index + 1, e),
				});
			};
			return execute(0, event);
		};
	},
}));

describe("Server Hooks", () => {
	let mockEvent: any;
	let mockResolve: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockEvent = {
			locals: {
				auth: vi.fn().mockResolvedValue(null), // Default no session
			},
			cookies: {
				get: vi.fn(),
				delete: vi.fn(),
			},
			request: {
				method: "GET",
			},
			url: {
				pathname: "/test",
			},
		};
		mockResolve = vi.fn().mockResolvedValue(new Response("ok"));
		// Default db mock to avoid crashes
		vi.mocked(db).mockResolvedValue([]);
	});

	it("should clear PHPSESSID if present", async () => {
		mockEvent.cookies.get.mockReturnValue("some-id");

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(mockEvent.cookies.delete).toHaveBeenCalledWith("PHPSESSID", { path: "/" });
	});

	it("should set event.locals.session if auth session exists", async () => {
		const mockSession = { user: { id: "user1" } };
		mockEvent.locals.auth.mockResolvedValue(mockSession);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(mockEvent.locals.session).toEqual(mockSession);
	});

	it("should clear session cookie if auth session is invalid but cookie exists", async () => {
		// Auth session is null (default)
		// Cookie exists
		vi.mocked(sessionModule.getSessionData).mockReturnValue({ login: "user1" } as any);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(sessionModule.clearSessionCookie).toHaveBeenCalledWith(mockEvent);
	});

	it("should clear session cookie if auth session user id does not match cookie login", async () => {
		const mockSession = { user: { id: "user2" } };
		mockEvent.locals.auth.mockResolvedValue(mockSession);
		vi.mocked(sessionModule.getSessionData).mockReturnValue({ login: "user1" } as any);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(sessionModule.clearSessionCookie).toHaveBeenCalledWith(mockEvent);
	});

	it("should use existing user data from cookie if valid", async () => {
		const mockSession = { user: { id: "user1" } };
		mockEvent.locals.auth.mockResolvedValue(mockSession);
		const mockUserData = { login: "user1", first_name: "John" };
		vi.mocked(sessionModule.getSessionData).mockReturnValue(mockUserData as any);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(mockEvent.locals.userData).toEqual(mockUserData);
		expect(db).not.toHaveBeenCalled();
	});

	it("should fetch user data from DB if session exists but no cookie data", async () => {
		const mockSession = { user: { id: "user1" } };
		mockEvent.locals.auth.mockResolvedValue(mockSession);
		vi.mocked(sessionModule.getSessionData).mockReturnValue(null);

		// Mock DB responses
		// First call: fetch user
		const mockUser = { id: 1, login: "user1", first_name: "John" };
		// Second call: fetch memberships
		const mockMembershipsData = [
			{
				member_id: 10,
				visible: true,
				association_id: 100,
				user_id: 1,
				first_name: "John",
				last_name: "Doe",
				user_email: "john@example.com",
				user_login: "user1",
				role_id: 5,
				role_name: "Member",
				role_permissions: 0,
				hierarchy: 1,
				user_promo: 2025,
			},
		];

		vi.mocked(db)
			.mockResolvedValueOnce([mockUser] as any) // User query
			.mockResolvedValueOnce(mockMembershipsData as any); // Memberships query

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(db).toHaveBeenCalledTimes(2);
		expect(sessionModule.setSessionCookie).toHaveBeenCalled();

		const expectedUserData = {
			...mockUser,
			memberships: [
				{
					id: 10,
					visible: true,
					association_id: 100,
					list_id: null,
					user: {
						id: 1,
						first_name: "John",
						last_name: "Doe",
						email: "john@example.com",
						login: "user1",
						promo: 2025,
					},
					role: {
						id: 5,
						name: "Member",
						permissions: 0,
						hierarchy: 1,
					},
				},
			],
		};

		// Check if setSessionCookie was called with expected data
		expect(sessionModule.setSessionCookie).toHaveBeenCalledWith(
			mockEvent,
			expect.objectContaining({
				id: 1,
				login: "user1",
			})
		);

		expect(mockEvent.locals.userData).toBeDefined();
		expect(mockEvent.locals.userData.id).toBe(1);
	});

	it("should handle user not found in DB", async () => {
		const mockSession = { user: { id: "user1" } };
		mockEvent.locals.auth.mockResolvedValue(mockSession);
		vi.mocked(sessionModule.getSessionData).mockReturnValue(null);

		// Mock DB to return empty array (user not found)
		vi.mocked(db).mockResolvedValue([]);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(db).toHaveBeenCalledTimes(1); // Only user query, no memberships query
		expect(sessionModule.setSessionCookie).not.toHaveBeenCalled();
		expect(mockEvent.locals.userData).toBeUndefined();
	});

	it("should handle DB error gracefully", async () => {
		const mockSession = { user: { id: "user1" } };
		mockEvent.locals.auth.mockResolvedValue(mockSession);
		vi.mocked(sessionModule.getSessionData).mockReturnValue(null);

		vi.mocked(db).mockRejectedValue(new Error("DB Error"));

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(logger.error).toHaveBeenCalled();
		expect(mockEvent.locals.userData).toBeUndefined();
	});

	it("should elevate user permissions to SITE_ADMIN if a role has SITE_ADMIN permission", async () => {
		const mockSession = { user: { id: "user1" } };
		mockEvent.locals.auth.mockResolvedValue(mockSession);
		vi.mocked(sessionModule.getSessionData).mockReturnValue(null);

		// Mock DB user fetch
		const mockUser = { id: 1, login: "user1" };
		vi.mocked(db).mockResolvedValueOnce([mockUser]);

		// Mock DB memberships fetch
		const mockMemberships = [
			{
				member_id: 1,
				visible: true,
				association_id: 1,
				user_id: 1,
				first_name: "User",
				last_name: "One",
				user_email: "user@test.com",
				user_login: "user1",
				role_id: 1,
				role_name: "Admin",
				role_permissions: Permission.SITE_ADMIN,
				hierarchy: 10,
				user_promo: 2025,
			},
		];
		vi.mocked(db).mockResolvedValueOnce(mockMemberships);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(mockEvent.locals.userData.permissions).toBe(Permission.SITE_ADMIN);
	});

	it("should elevate user permissions to ADMIN if a role has ADMIN permission", async () => {
		const mockSession = { user: { id: "user1" } };
		mockEvent.locals.auth.mockResolvedValue(mockSession);
		vi.mocked(sessionModule.getSessionData).mockReturnValue(null);

		// Mock DB user fetch
		const mockUser = { id: 1, login: "user1" };
		vi.mocked(db).mockResolvedValueOnce([mockUser]);

		// Mock DB memberships fetch
		const mockMemberships = [
			{
				member_id: 1,
				visible: true,
				association_id: 1,
				user_id: 1,
				first_name: "User",
				last_name: "One",
				user_email: "user@test.com",
				user_login: "user1",
				role_id: 1,
				role_name: "Admin",
				role_permissions: Permission.ADMIN, // ADMIN
				hierarchy: 10,
				user_promo: 2025,
			},
		];
		vi.mocked(db).mockResolvedValueOnce(mockMemberships);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(mockEvent.locals.userData.permissions).toBe(Permission.ADMIN);
	});

	it("should prioritize SITE_ADMIN over ADMIN if user has both", async () => {
		const mockSession = { user: { id: "user1" } };
		mockEvent.locals.auth.mockResolvedValue(mockSession);
		vi.mocked(sessionModule.getSessionData).mockReturnValue(null);

		// Mock DB user fetch
		const mockUser = { id: 1, login: "user1" };
		vi.mocked(db).mockResolvedValueOnce([mockUser]);

		// Mock DB memberships fetch
		const mockMemberships = [
			{
				member_id: 1,
				visible: true,
				association_id: 1,
				user_id: 1,
				first_name: "User",
				last_name: "One",
				user_email: "user@test.com",
				user_login: "user1",
				role_id: 1,
				role_name: "Admin",
				role_permissions: Permission.ADMIN, // ADMIN
				hierarchy: 10,
				user_promo: 2025,
			},
			{
				member_id: 2,
				visible: true,
				association_id: 2,
				user_id: 1,
				first_name: "User",
				last_name: "One",
				user_email: "user@test.com",
				user_login: "user1",
				role_id: 2,
				role_name: "Site Admin",
				role_permissions: Permission.SITE_ADMIN, // SITE_ADMIN
				hierarchy: 10,
				user_promo: 2025,
			},
		];
		vi.mocked(db).mockResolvedValueOnce(mockMemberships);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(mockEvent.locals.userData.permissions).toBe(Permission.SITE_ADMIN);
	});
});
