import { describe, it, expect, vi, beforeEach } from "vitest";
import { load } from "../../../src/routes/admin/+page.server";
import { redirect } from "@sveltejs/kit";
import * as authMiddleware from "../../../src/lib/server/auth-middleware";
import Permission from "../../../src/lib/permissions";

// Mock dependencies
vi.mock("@sveltejs/kit", () => ({
	redirect: vi.fn(),
}));

vi.mock("../../../src/lib/server/auth-middleware", () => ({
	requirePermission: vi.fn(),
}));

describe("Admin Page Server Load", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should redirect to /auth/signin if no session", async () => {
		const event = {
			locals: { session: null },
		} as any;

		vi.mocked(authMiddleware.requirePermission).mockResolvedValue(null);

		try {
			await load(event);
		} catch (e) {
			// redirect throws, so we catch it
		}

		expect(redirect).toHaveBeenCalledWith(303, "/auth/signin");
	});

	it("should redirect to / if user does not have permission", async () => {
		const event = {
			locals: { session: { user: { id: 1 } } },
		} as any;

		// requirePermission returns null if permission check fails (based on how it's used in the load function)
		// Wait, looking at the code: const user = await requirePermission(event, Permission.ADMIN);
		// If requirePermission handles the redirect internally, then load might not need to check user?
		// But the code says: if (!user) throw redirect(303, "/");
		// So requirePermission likely returns null if not authorized but doesn't redirect itself?
		// Let's assume requirePermission returns null if not authorized.
		vi.mocked(authMiddleware.requirePermission).mockResolvedValue(null);

		try {
			await load(event);
		} catch (e) {
			// redirect throws
		}

		expect(redirect).toHaveBeenCalledWith(303, "/");
	});

	it("should return empty object if user has permission", async () => {
		const event = {
			locals: { session: { user: { id: 1 } } },
		} as any;

		const mockUser = { id: 1, permissions: Permission.ADMIN };
		vi.mocked(authMiddleware.requirePermission).mockResolvedValue(mockUser as any);

		const result = await load(event);

		expect(result).toEqual({});
		expect(authMiddleware.requirePermission).toHaveBeenCalledWith(event, Permission.ADMIN);
	});
});
