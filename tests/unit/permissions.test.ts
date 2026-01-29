import { describe, it, expect } from "vitest";
import Permission, { hasPermission, getPermissionName } from "$lib/permissions";

describe("Permissions System", () => {
	describe("Permission Enum", () => {
		it("should have correct values", () => {
			expect(Permission.MEMBER).toBe(0);
			expect(Permission.MANAGE).toBe(1);
			expect(Permission.ADMIN).toBe(2);
		});
	});

	describe("hasPermission", () => {
		it("should return true if user has equal permission", () => {
			expect(hasPermission(Permission.MEMBER, Permission.MEMBER)).toBe(true);
			expect(hasPermission(Permission.ADMIN, Permission.ADMIN)).toBe(true);
		});

		it("should return true if user has higher permission", () => {
			expect(hasPermission(Permission.MANAGE, Permission.MEMBER)).toBe(true);
		});

		it("should return false if user has lower permission", () => {
			expect(hasPermission(Permission.MEMBER, Permission.MANAGE)).toBe(false);
			expect(hasPermission(Permission.MANAGE, Permission.ADMIN)).toBe(false);
		});
	});

	describe("getPermissionName", () => {
		it("should return correct names", () => {
			expect(getPermissionName(Permission.MEMBER)).toBe("Membre");
			expect(getPermissionName(Permission.MANAGE)).toBe("Gestion des Membres & Événements");
			expect(getPermissionName(Permission.ADMIN)).toBe("Administration");
		});

		it("should return unknown for invalid permission", () => {
			expect(getPermissionName(99)).toBe("Inconnu (99)");
		});
	});
});
