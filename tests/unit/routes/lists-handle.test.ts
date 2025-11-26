import { describe, it, expect, vi } from "vitest";
import { load } from "../../../src/routes/lists/[handle]/+page";

// Mock $app/paths
vi.mock("$app/paths", () => ({
	resolve: (path: string) => path,
}));

describe("Lists Handle Page Load", () => {
	it("should fetch list and roles", async () => {
		const mockList = { id: 1, name: "Test List" };
		const mockEvents = [{ id: 1, title: "Event 1" }];
		const mockRoles = [{ id: 1, name: "Prez" }];

		const fetchMock = vi.fn().mockImplementation((url) => {
			if (url.includes("/api/lists/handle/test-list")) {
				return Promise.resolve({
					json: () => Promise.resolve(mockList),
				});
			}
			if (url.includes("/api/calendar?list=1")) {
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
			params: { handle: "test-list" },
			fetch: fetchMock,
		} as any;

		const result = await load(event);

		expect(result).toEqual({
			list: mockList,
			roles: mockRoles,
			events: mockEvents,
		});

		expect(fetchMock).toHaveBeenCalledTimes(3);
	});
});
