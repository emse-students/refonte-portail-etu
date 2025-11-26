import { describe, it, expect } from "vitest";
import mockDb, {
	getPool,
	getBasicAssociation,
	getAssociationWithMembers,
	escape,
} from "$lib/server/database-mock";
import { TestData } from "../data-factory";

describe("Database Mock", () => {
	it("should return association data for association query", async () => {
		const result = await mockDb`SELECT * FROM association`;
		expect(result).toEqual([TestData.association]);
	});

	it("should return user data for user query", async () => {
		const result = await mockDb`SELECT * FROM user`;
		expect(result).toEqual([TestData.user]);
	});

	it("should return member data for member query", async () => {
		const result = await mockDb`SELECT * FROM member`;
		expect(result).toEqual([TestData.member]);
	});

	it("should return event data for event query", async () => {
		const result = await mockDb`SELECT * FROM event`;
		expect(result).toEqual([TestData.event]);
	});

	it("should return role data for role query", async () => {
		const result = await mockDb`SELECT * FROM role`;
		expect(result).toEqual([TestData.adminRole]);
	});

	it("should return empty array for unknown query", async () => {
		const result = await mockDb`SELECT * FROM unknown_table`;
		expect(result).toEqual([]);
	});

	it("should return a mock pool", async () => {
		const pool = getPool();
		expect(pool).toHaveProperty("query");
		await expect(pool.query()).resolves.toEqual([[], []]);
	});

	it("should escape values", () => {
		expect(escape("test")).toBe("'test'");
	});

	it("should return basic association", async () => {
		const raw = { id: 1 } as any;
		const result = await getBasicAssociation(raw);
		expect(result).toEqual({
			...TestData.association,
			members: [],
			icon: "icon.png",
		});
	});

	it("should return association with members", async () => {
		const raw = { id: 1 } as any;
		const result = await getAssociationWithMembers(raw);
		expect(result.members).toHaveLength(1);
		expect(result.members[0].user).toEqual(TestData.user);
	});
});
