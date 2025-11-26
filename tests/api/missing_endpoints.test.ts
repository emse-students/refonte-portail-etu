import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as GET_USER_LOGIN } from "../../src/routes/api/users/login/[login]/+server";
import { GET as GET_USER_AVATAR } from "../../src/routes/api/users/login/[login]/avatar/+server";
import { GET as GET_USER_ME } from "../../src/routes/api/users/me/+server";
import { GET as GET_USER_ID } from "../../src/routes/api/users/[id]/+server";
import { GET as GET_ASSO_HANDLE } from "../../src/routes/api/associations/handle/[handle]/+server";
import { GET as GET_LIST_HANDLE } from "../../src/routes/api/lists/handle/[handle]/+server";
import { GET as GET_LIST_ID } from "../../src/routes/api/lists/[id]/+server";
import { POST as POST_FINALIZE } from "../../src/routes/api/events/finalize-submission/+server";
import { POST as POST_OPEN } from "../../src/routes/api/events/open-submissions/+server";
import { GET as GET_CALENDAR } from "../../src/routes/api/calendar/+server";

import db, {
	getPool,
	getAssociationWithMembers,
	getListWithMembers,
	getBasicList,
	escape,
} from "$lib/server/database";
import {
	requireAuth,
	requirePermission,
	getAuthorizedAssociationIds,
	getAuthorizedListIds,
} from "$lib/server/auth-middleware";
import Permission, { hasPermission } from "$lib/permissions";
import type { RequestEvent } from "@sveltejs/kit";

// Mock dependencies
vi.mock("$lib/server/database", () => ({
	default: vi.fn(),
	getPool: vi.fn(),
	getAssociationWithMembers: vi.fn(),
	getListWithMembers: vi.fn(),
	getBasicList: vi.fn(),
	escape: vi.fn((val) => `'${val}'`),
}));

vi.mock("$lib/server/auth-middleware", () => ({
	requireAuth: vi.fn(),
	requirePermission: vi.fn(),
	forbiddenResponse: vi.fn(() => new Response("Forbidden", { status: 403 })),
	getAuthorizedAssociationIds: vi.fn(),
	getAuthorizedListIds: vi.fn(),
}));

vi.mock("$lib/permissions", async (importOriginal) => {
	const actual = await importOriginal<typeof import("$lib/permissions")>();
	return {
		...actual,
		hasPermission: vi.fn(),
	};
});

// Mock global fetch
global.fetch = vi.fn() as unknown as typeof fetch;

describe("Missing Endpoints API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
			query: vi.fn().mockResolvedValue([]),
		});
	});

	describe("Users API", () => {
		describe("GET /api/users/login/[login]", () => {
			it("should return user by login", async () => {
				const mockUser = { id: 1, login: "jdoe" };
				(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([mockUser]);

				const event = {
					params: { login: "jdoe" },
					url: { searchParams: new URLSearchParams() },
				} as unknown as RequestEvent;
				const response = await GET_USER_LOGIN(event);
				const data = await response.json();

				expect(data.user).toEqual(mockUser);
			});

			it("should return 404 if user not found", async () => {
				(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

				const event = {
					params: { login: "unknown" },
					url: { searchParams: new URLSearchParams() },
				} as unknown as RequestEvent;
				const response = await GET_USER_LOGIN(event);
				const data = await response.json();

				expect(response.status).toBe(404);
				expect(data.error).toBe("User not found");
			});
		});

		describe("GET /api/users/login/[login]/avatar", () => {
			it("should return avatar if authenticated and found", async () => {
				const event = {
					params: { login: "jdoe" },
					locals: { session: { user: { id: 1 } } },
					fetch: vi.fn().mockResolvedValue({
						ok: true,
						arrayBuffer: async () => new ArrayBuffer(8),
					}),
				} as unknown as RequestEvent;

				const response = await GET_USER_AVATAR(event);

				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toBe("image/jpeg");
			});

			it("should return 401 if not authenticated", async () => {
				const event = {
					params: { login: "jdoe" },
					locals: { session: null },
				} as unknown as RequestEvent;

				const response = await GET_USER_AVATAR(event);

				expect(response.status).toBe(401);
			});
		});

		describe("GET /api/users/me", () => {
			it("should return current user details", async () => {
				const mockUser = { id: 1, login: "jdoe" };
				(global.fetch as any).mockResolvedValue({
					json: async () => mockUser,
				});

				const event = {
					locals: { userData: { id: 1 } },
				} as unknown as RequestEvent;

				const response = await GET_USER_ME(event);
				const data = await response.json();

				expect(data.user).toEqual(mockUser);
			});

			it("should return 401 if not authenticated", async () => {
				const event = {
					locals: { userData: null },
				} as unknown as RequestEvent;

				const response = await GET_USER_ME(event);

				expect(response.status).toBe(401);
			});
		});

		describe("GET /api/users/[id]", () => {
			it("should return user by id", async () => {
				const mockUser = { id: 1, login: "jdoe" };
				(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([mockUser]);

				const event = {
					params: { id: "1" },
					url: { searchParams: new URLSearchParams() },
				} as unknown as RequestEvent;
				const response = await GET_USER_ID(event);
				const data = await response.json();

				expect(data.user).toEqual(mockUser);
			});
		});
	});

	describe("Associations & Lists API", () => {
		describe("GET /api/associations/handle/[handle]", () => {
			it("should return association by handle", async () => {
				const mockAsso = { id: 1, handle: "asso1" };
				(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([mockAsso]);
				(getAssociationWithMembers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
					mockAsso
				);

				const event = { params: { handle: "asso1" } } as unknown as RequestEvent;
				const response = await GET_ASSO_HANDLE(event);
				const data = await response.json();

				expect(data).toEqual(mockAsso);
			});

			it("should return 404 if not found", async () => {
				(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

				const event = { params: { handle: "unknown" } } as unknown as RequestEvent;
				const response = await GET_ASSO_HANDLE(event);

				expect(response.status).toBe(404);
			});
		});

		describe("GET /api/lists/handle/[handle]", () => {
			it("should return list by handle", async () => {
				const mockList = { id: 1, handle: "list1" };
				(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([mockList]);
				(getListWithMembers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockList);

				const event = { params: { handle: "list1" } } as unknown as RequestEvent;
				const response = await GET_LIST_HANDLE(event);
				const data = await response.json();

				expect(data).toEqual(mockList);
			});
		});

		describe("GET /api/lists/[id]", () => {
			it("should return list by id", async () => {
				const mockList = { id: 1, name: "List 1" };
				(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([mockList]);
				(getBasicList as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockList);

				const request = new Request("http://localhost/api/lists/1");
				const event = { params: { id: "1" }, request } as unknown as RequestEvent;
				const response = await GET_LIST_ID(event);
				const data = await response.json();

				expect(data).toEqual(mockList);
			});
		});
	});

	describe("Events & Calendar API", () => {
		describe("POST /api/events/finalize-submission", () => {
			it("should finalize submission if authorized", async () => {
				(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
					permissions: Permission.EVENTS,
				});
				(hasPermission as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
				(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

				const event = {} as RequestEvent;
				const response = await POST_FINALIZE(event);
				const data = await response.json();

				expect(data.success).toBe(true);
				expect(db).toHaveBeenCalled();
			});

			it("should return 403 if forbidden", async () => {
				(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ permissions: 0 });
				(hasPermission as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

				const event = {} as RequestEvent;
				const response = await POST_FINALIZE(event);

				expect(response.status).toBe(403);
			});
		});

		describe("POST /api/events/open-submissions", () => {
			it("should open submissions if authorized", async () => {
				(requirePermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });
				(db as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

				const event = {} as RequestEvent;
				const response = await POST_OPEN(event);
				const data = await response.json();

				expect(data.success).toBe(true);
			});
		});

		describe("GET /api/calendar", () => {
			it("should return events", async () => {
				const mockEvents = [{ id: 1, title: "Event 1" }];
				const queryMock = vi.fn().mockResolvedValue([mockEvents]);
				(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: queryMock });
				(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null); // Unauthenticated

				const url = new URL("http://localhost/api/calendar?start=2023-01-01&end=2023-01-31");
				const event = { url } as unknown as RequestEvent;

				const response = await GET_CALENDAR(event);
				const data = await response.json();

				expect(data).toEqual(mockEvents);
				expect(queryMock).toHaveBeenCalled();
			});
		});
	});
});
