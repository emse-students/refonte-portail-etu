import { describe, it, expect } from "vitest";
import mockDb from "$lib/server/database-mock";
import { TestData } from "../data-factory";

describe("Database Mock", () => {
	it("should handle queries with newlines", async () => {
		const result = await mockDb`
            SELECT *
            FROM
            association
        `;
		expect(result).toEqual([TestData.association]);
	});
});
