import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as POST_LOGOUT } from "../../src/routes/api/auth/logout/+server";
import { POST as POST_REFRESH } from "../../src/routes/api/auth/refresh/+server";
import { requireAuth } from "$lib/server/auth-middleware";
import { clearSessionCookie } from "$lib/server/session";
import type { RequestEvent } from "@sveltejs/kit";

// Mock dependencies
vi.mock("$lib/server/auth-middleware", () => ({
	requireAuth: vi.fn(),
}));

vi.mock("$lib/server/session", () => ({
	clearSessionCookie: vi.fn(),
}));

describe("Auth API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("POST /api/auth/logout", () => {
		it("should clear session cookie and return success", async () => {
			const request = new Request("http://localhost/api/auth/logout", { method: "POST" });
			const event = { request } as RequestEvent;

			const response = await POST_LOGOUT(event);
			const data = await response.json();

			expect(clearSessionCookie).toHaveBeenCalledWith(event);
			expect(response.status).toBe(200);
			expect(data).toEqual({ success: true, message: "Déconnecté avec succès" });
		});
	});

	describe("POST /api/auth/refresh", () => {
		it("should refresh session if authorized", async () => {
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });

			const request = new Request("http://localhost/api/auth/refresh", { method: "POST" });
			const event = { request } as RequestEvent;

			const response = await POST_REFRESH(event);
			const data = await response.json();

			expect(requireAuth).toHaveBeenCalledWith(event);
			expect(clearSessionCookie).toHaveBeenCalledWith(event);
			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
		});

		it("should return 401 if unauthorized", async () => {
			(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			const request = new Request("http://localhost/api/auth/refresh", { method: "POST" });
			const event = { request } as RequestEvent;

			const response = await POST_REFRESH(event);
			const data = await response.json();

			expect(requireAuth).toHaveBeenCalledWith(event);
			expect(clearSessionCookie).not.toHaveBeenCalled();
			expect(response.status).toBe(401);
			expect(data.error).toBe("Non autorisé");
		});
	});
});
