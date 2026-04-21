import { describe, it, expect, vi, beforeEach } from "vitest";
import { handle } from "../../src/hooks.server";
import * as sessionModule from "../../src/lib/server/session";
import db from "../../src/lib/server/database";
import logger from "../../src/lib/server/logger";
import Permission from "$lib/permissions";
import { findUserByAuthIdentifier, matchesUserAuthIdentifier } from "$lib/server/auth";

vi.mock("$lib/server/logger", () => ({
	default: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		warn: vi.fn(),
	},
}));

vi.mock("$lib/server/auth", () => ({
	handle: vi.fn(async ({ event, resolve }) => resolve(event)),
	findUserByAuthIdentifier: vi.fn(),
	matchesUserAuthIdentifier: vi.fn(
		(id: string, user: { login?: string; uid?: string }) => id === user.login || id === user.uid
	),
}));

vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
}));

vi.mock("$lib/server/session", () => ({
	getSessionData: vi.fn(),
	setSessionCookie: vi.fn(),
	clearSessionCookie: vi.fn(),
	refreshSessionCookie: vi.fn(),
}));

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
				session: null,
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
		vi.mocked(db).mockResolvedValue([]);
		vi.mocked(findUserByAuthIdentifier).mockResolvedValue(null);
	});

	it("should clear PHPSESSID if present", async () => {
		mockEvent.cookies.get.mockReturnValue("some-id");

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(mockEvent.cookies.delete).toHaveBeenCalledWith("PHPSESSID", { path: "/" });
	});

	it("should keep event.locals.session if already provided by auth handle", async () => {
		const mockSession = { user: { id: "user1" } };
		mockEvent.locals.session = mockSession;

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(mockEvent.locals.session).toEqual(mockSession);
	});

	it("should clear session cookie if session is missing but cookie data exists", async () => {
		vi.mocked(sessionModule.getSessionData).mockReturnValue({ login: "user1" } as any);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(sessionModule.clearSessionCookie).toHaveBeenCalledWith(mockEvent);
	});

	it("should clear session cookie if session id does not match cookie user identifiers", async () => {
		mockEvent.locals.session = { user: { id: "user2" } };
		vi.mocked(sessionModule.getSessionData).mockReturnValue({ login: "user1", uid: "uid1" } as any);
		vi.mocked(matchesUserAuthIdentifier).mockReturnValue(false);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(sessionModule.clearSessionCookie).toHaveBeenCalledWith(mockEvent);
		expect(matchesUserAuthIdentifier).toHaveBeenCalled();
	});

	it("should use existing user data from cookie if valid", async () => {
		mockEvent.locals.session = { user: { id: "user1" } };
		const mockUserData = { login: "user1", first_name: "John", uid: "uid1" };
		vi.mocked(sessionModule.getSessionData).mockReturnValue(mockUserData as any);
		vi.mocked(matchesUserAuthIdentifier).mockReturnValue(true);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(mockEvent.locals.userData).toEqual(mockUserData);
		expect(findUserByAuthIdentifier).not.toHaveBeenCalled();
	});

	it("should fetch user data when session exists but no cookie data", async () => {
		mockEvent.locals.session = { user: { id: "uid-user1" } };
		vi.mocked(sessionModule.getSessionData).mockReturnValue(null);

		const mockUser = {
			id: 1,
			login: "user1",
			uid: "uid-user1",
			first_name: "John",
			last_name: "Doe",
			email: "john@example.com",
			promo: 2025,
			admin: false,
		};
		const mockMembershipsData = [
			{
				member_id: 10,
				visible: true,
				association_id: 100,
				list_id: null,
				role_name: "Member",
				role_permissions: 0,
				hierarchy: 1,
			},
		];

		vi.mocked(findUserByAuthIdentifier).mockResolvedValue(mockUser as any);
		vi.mocked(db).mockResolvedValueOnce(mockMembershipsData as any);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(findUserByAuthIdentifier).toHaveBeenCalledWith("uid-user1");
		expect(db).toHaveBeenCalledTimes(1);
		expect(sessionModule.setSessionCookie).toHaveBeenCalled();
		expect(mockEvent.locals.userData).toBeDefined();
		expect(mockEvent.locals.userData.id).toBe(1);
	});

	it("should handle user not found", async () => {
		mockEvent.locals.session = { user: { id: "user1" } };
		vi.mocked(sessionModule.getSessionData).mockReturnValue(null);
		vi.mocked(findUserByAuthIdentifier).mockResolvedValue(null);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(db).not.toHaveBeenCalled();
		expect(sessionModule.setSessionCookie).not.toHaveBeenCalled();
		expect(mockEvent.locals.userData).toBeUndefined();
	});

	it("should handle DB error gracefully", async () => {
		mockEvent.locals.session = { user: { id: "user1" } };
		vi.mocked(sessionModule.getSessionData).mockReturnValue(null);
		vi.mocked(findUserByAuthIdentifier).mockResolvedValue({ id: 1 } as any);
		vi.mocked(db).mockRejectedValue(new Error("DB Error"));

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(logger.error).toHaveBeenCalled();
		expect(mockEvent.locals.userData).toBeUndefined();
	});

	it("should elevate permissions to ADMIN when a membership has ADMIN", async () => {
		mockEvent.locals.session = { user: { id: "user1" } };
		vi.mocked(sessionModule.getSessionData).mockReturnValue(null);

		const mockUser = {
			id: 1,
			login: "user1",
			uid: "uid1",
			first_name: "User",
			last_name: "One",
			email: "user@test.com",
			promo: 2025,
			admin: false,
		};
		vi.mocked(findUserByAuthIdentifier).mockResolvedValue(mockUser as any);
		vi.mocked(db).mockResolvedValueOnce([
			{
				member_id: 1,
				visible: true,
				association_id: 1,
				list_id: null,
				role_name: "Admin",
				role_permissions: Permission.ADMIN,
				hierarchy: 10,
			},
		] as any);

		await handle({ event: mockEvent, resolve: mockResolve });

		expect(mockEvent.locals.userData.permissions).toBe(Permission.ADMIN);
	});
});
