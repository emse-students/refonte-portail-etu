import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchEvents } from "$lib/server/events";
import { getPool } from "$lib/server/database";

// Mock database
vi.mock("$lib/server/database", () => {
	const queryMock = vi.fn();
	return {
		default: vi.fn(),
		getPool: vi.fn(() => ({ query: queryMock })),
		escape: vi.fn((val) => `'${val}'`),
	};
});

describe("fetchEvents", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should generate correct SQL for overlapping date range", async () => {
		const queryMock = vi.fn().mockResolvedValue([[], undefined]);
		(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: queryMock });

		const start = new Date("2023-01-01T00:00:00.000Z");
		const end = new Date("2023-01-07T23:59:59.999Z");

		await fetchEvents({
			start,
			end,
			user: null,
			requestAll: true,
		});

		const sqlCall = queryMock.mock.calls[0][0];

		// Correct overlap logic: end_date >= requested_start AND start_date <= requested_end
		expect(sqlCall).toContain(`e.end_date >= '${start.toISOString()}'`);
		expect(sqlCall).toContain(`e.start_date <= '${end.toISOString()}'`);
	});

	it("should generate correct SQL for specific association", async () => {
		const queryMock = vi.fn().mockResolvedValue([[], undefined]);
		(getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ query: queryMock });

		await fetchEvents({
			assocId: 123,
			user: null,
		});

		const sqlCall = queryMock.mock.calls[0][0];
		expect(sqlCall).toContain("e.association_id = '123'");
	});
});
