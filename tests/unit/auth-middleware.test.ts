import { describe, it, expect } from "vitest";
import {
	requireAuth,
	requirePermission,
	checkPermission,
	hasAssociationPermission,
	hasListPermission,
	getAuthorizedAssociationIds,
} from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";
import type { RequestEvent } from "@sveltejs/kit";
import type { FullUser, Member } from "$lib/databasetypes";

// Helper to create a mock event
function createMockEvent(userData: FullUser | null = null): RequestEvent {
	return {
		locals: {
			userData,
			session: userData ? { user: { id: String(userData.id) } } : null,
		},
	} as unknown as RequestEvent;
}

// Helper to create a mock user
function createMockUser(permissions: number = 0, memberships: Member[] = []): FullUser {
	return {
		id: 1,
		first_name: "Test",
		last_name: "User",
		login: "test",
		email: "test@test.com",
		promo: 2024,
		permissions,
		memberships,
	};
}

describe("Auth Middleware", () => {
	describe("requireAuth", () => {
		it("should return user if authenticated", async () => {
			const user = createMockUser();
			const event = createMockEvent(user);
			const result = await requireAuth(event);
			expect(result).toEqual(user);
		});

		it("should return null if not authenticated", async () => {
			const event = createMockEvent(null);
			const result = await requireAuth(event);
			expect(result).toBeNull();
		});
	});

	describe("requirePermission", () => {
		it("should return user if has permission", async () => {
			const user = createMockUser(Permission.ADMIN);
			const event = createMockEvent(user);
			const result = await requirePermission(event, Permission.ADMIN);
			expect(result).toEqual(user);
		});

		it("should return null if user does not have permission", async () => {
			const user = createMockUser(Permission.MEMBER);
			const event = createMockEvent(user);
			const result = await requirePermission(event, Permission.ADMIN);
			expect(result).toBeNull();
		});

		it("should return null if not authenticated", async () => {
			const event = createMockEvent(null);
			const result = await requirePermission(event, Permission.ADMIN);
			expect(result).toBeNull();
		});
	});

	describe("checkPermission", () => {
		it("should return authorized: true if has permission", async () => {
			const user = createMockUser(Permission.ADMIN);
			const event = createMockEvent(user);
			const result = await checkPermission(event, Permission.ADMIN);
			expect(result).toEqual({ authorized: true, user });
		});

		it("should return authorized: false and 403 if no permission", async () => {
			const user = createMockUser(Permission.MEMBER);
			const event = createMockEvent(user);
			const result = await checkPermission(event, Permission.ADMIN);
			expect(result.authorized).toBe(false);
			if (!result.authorized) {
				expect(result.response.status).toBe(403);
			}
		});

		it("should return authorized: false and 401 if not authenticated", async () => {
			const event = createMockEvent(null);
			const result = await checkPermission(event, Permission.ADMIN);
			expect(result.authorized).toBe(false);
			if (!result.authorized) {
				expect(result.response.status).toBe(401);
			}
		});
	});

	describe("hasAssociationPermission", () => {
		const assoId = 10;
		const otherAssoId = 20;

		it("should return true if user is global admin", () => {
			const user = createMockUser(Permission.ADMIN);
			expect(hasAssociationPermission(user, assoId, Permission.ROLES)).toBe(true);
		});

		it("should return true if user has permission in association", () => {
			const user = createMockUser(0, [
				{
					id: 1,
					association_id: assoId,
					list_id: null,
					role: { id: 1, name: "Admin", permissions: Permission.ROLES, hierarchy: 1 },
					user: {} as any,
					visible: true,
				},
			]);
			expect(hasAssociationPermission(user, assoId, Permission.ROLES)).toBe(true);
		});

		it("should return false if user has permission in OTHER association", () => {
			const user = createMockUser(0, [
				{
					id: 1,
					association_id: otherAssoId,
					list_id: null,
					role: { id: 1, name: "Admin", permissions: Permission.ROLES, hierarchy: 1 },
					user: {} as any,
					visible: true,
				},
			]);
			expect(hasAssociationPermission(user, assoId, Permission.ROLES)).toBe(false);
		});

		it("should return false if user has insufficient permission in association", () => {
			const user = createMockUser(0, [
				{
					id: 1,
					association_id: assoId,
					list_id: null,
					role: { id: 1, name: "Member", permissions: Permission.MEMBER, hierarchy: 1 },
					user: {} as any,
					visible: true,
				},
			]);
			expect(hasAssociationPermission(user, assoId, Permission.ROLES)).toBe(false);
		});
	});

	describe("getAuthorizedAssociationIds", () => {
		it("should return null for global admin", () => {
			const user = createMockUser(Permission.ADMIN);
			expect(getAuthorizedAssociationIds(user, Permission.ROLES)).toBeNull();
		});

		it("should return list of association IDs where user has permission", () => {
			const user = createMockUser(0, [
				{
					id: 1,
					association_id: 10,
					list_id: null,
					role: { id: 1, name: "Admin", permissions: Permission.ROLES, hierarchy: 1 },
					user: {} as any,
					visible: true,
				},
				{
					id: 2,
					association_id: 20,
					list_id: null,
					role: { id: 2, name: "Member", permissions: Permission.MEMBER, hierarchy: 1 },
					user: {} as any,
					visible: true,
				},
				{
					id: 3,
					association_id: 30,
					list_id: null,
					role: { id: 3, name: "Admin", permissions: Permission.ROLES, hierarchy: 1 },
					user: {} as any,
					visible: true,
				},
			]);
			expect(getAuthorizedAssociationIds(user, Permission.ROLES)).toEqual([10, 30]);
		});

		it("should return empty array if no permissions", () => {
			const user = createMockUser(0, []);
			expect(getAuthorizedAssociationIds(user, Permission.ROLES)).toEqual([]);
		});
	});
});
