import { describe, it, expect, vi } from "vitest";
import { load } from "../../../src/routes/associations/[handle]/+page";

// Mock $app/paths
vi.mock("$app/paths", () => ({
	resolve: (path: string) => path,
}));

describe("Associations Handle Page Load", () => {
	it("should fetch association, events, and roles", async () => {
		const mockAssociation = { id: 1, name: "Test Asso" };
		const mockEvents = [{ id: 1, title: "Event 1" }];
		const mockRoles = [{ id: 1, name: "Prez" }];

		const fetchMock = vi.fn().mockImplementation((url) => {
			if (url.includes("/api/associations/handle/test-asso")) {
				return Promise.resolve({
					json: () => Promise.resolve(mockAssociation),
				});
			}
			if (url.includes("/api/calendar?asso=1")) {
				return Promise.resolve({
					json: () => Promise.resolve(mockEvents),
				});
			}
			if (url.includes("/api/roles")) {
				return Promise.resolve({
					json: () => Promise.resolve(mockRoles),
				});
			}
			return Promise.reject(new Error(`Unexpected URL: ${url}`));
		});

		const event = {
			params: { handle: "test-asso" },
			fetch: fetchMock,
		} as any;

		const result = await load(event);

		expect(result).toEqual({
			association: mockAssociation,
			events: mockEvents,
			roles: mockRoles,
		});

		expect(fetchMock).toHaveBeenCalledTimes(3);
	});
});
