import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as mockDbModule from "$lib/server/database-mock";

// Mock mysql2/promise
const mockQuery = vi.fn();
const mockPool = {
	query: mockQuery,
};
const mockCreatePool = vi.fn(() => mockPool);

vi.mock("mysql2/promise", () => ({
	createPool: mockCreatePool,
	escape: (val: any) => `'${val}'`,
}));

// Mock database-mock
vi.mock("$lib/server/database-mock", () => ({
	default: vi.fn(),
	getPool: vi.fn(),
	getBasicAssociation: vi.fn(),
	getAssociationWithMembers: vi.fn(),
}));

describe("Database Module", () => {
	let dbModule: any;

	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		process.env.MOCK_DB = "false";
		process.env.DB_HOST = "localhost";
		process.env.DB_USER = "user";
		process.env.DB_PASSWORD = "password";
		process.env.DB_NAME = "test_db";
	});

	afterEach(() => {
		delete process.env.MOCK_DB;
	});

	it("should create a pool with correct config when not using mock", async () => {
		dbModule = await import("$lib/server/database");
		// Trigger pool creation
		dbModule.getPool();
		expect(mockCreatePool).toHaveBeenCalledWith(
			expect.objectContaining({
				host: "localhost",
				user: "user",
				database: "test_db",
				connectionLimit: 10,
			})
		);
	});

	it("should execute query using pool when not using mock", async () => {
		dbModule = await import("$lib/server/database");
		mockQuery.mockResolvedValue([[{ id: 1 }]]);

		const result = await dbModule.default`SELECT * FROM users WHERE id = ${1}`;

		expect(mockQuery).toHaveBeenCalled();
		expect(result).toEqual([{ id: 1 }]);
	});

	it("should use mock module when MOCK_DB is true", async () => {
		process.env.MOCK_DB = "true";
		dbModule = await import("$lib/server/database");

		await dbModule.default`SELECT * FROM users`;
		expect(mockDbModule.default).toHaveBeenCalled();

		dbModule.getPool();
		expect(mockDbModule.getPool).toHaveBeenCalled();

		const raw = { id: 1, handle: "asso", name: "Asso", description: "Desc", icon: 1, color: "red" };
		await dbModule.getBasicAssociation(raw);
		expect(mockDbModule.getBasicAssociation).toHaveBeenCalledWith(raw);

		await dbModule.getAssociationWithMembers(raw);
		expect(mockDbModule.getAssociationWithMembers).toHaveBeenCalledWith(raw);
	});

	it("should get basic association from DB", async () => {
		dbModule = await import("$lib/server/database");
		// No extra query needed for icon anymore

		const raw = {
			id: 1,
			handle: "asso",
			name: "Asso",
			description: "Desc",
			icon: 123,
			color: "red",
		};
		const result = await dbModule.getBasicAssociation(raw);

		expect(result.icon).toBe(123);
	});

	it("should get association with members from DB", async () => {
		dbModule = await import("$lib/server/database");
		mockQuery.mockResolvedValueOnce([
			[
				{
					member_id: 1,
					visible: true,
					user_id: 10,
					first_name: "John",
					last_name: "Doe",
					user_email: "john@doe.com",
					user_login: "jdoe",
					role_id: 5,
					role_name: "Prez",
					role_permissions: 1,
					hierarchy: 1,
					user_promo: 2024,
				},
			],
		]); // Members query only

		const raw = {
			id: 1,
			handle: "asso",
			name: "Asso",
			description: "Desc",
			icon: 456,
			color: "red",
		};
		const result = await dbModule.getAssociationWithMembers(raw);

		expect(result.members).toHaveLength(1);
		expect(result.members[0].user.first_name).toBe("John");
		expect(result.icon).toBe(456);
	});

	it("should get basic list from DB", async () => {
		dbModule = await import("$lib/server/database");
		// No extra query needed for icon anymore

		const raw = {
			id: 1,
			handle: "list",
			name: "List",
			description: "Desc",
			icon: 789,
			color: "blue",
			promo: 2024,
			association_id: 10,
		};
		const result = await dbModule.getBasicList(raw);

		expect(result.icon).toBe(789);
	});

	it("should get list with members from DB", async () => {
		dbModule = await import("$lib/server/database");
		mockQuery.mockResolvedValueOnce([
			[
				{
					member_id: 1,
					visible: true,
					user_id: 10,
					first_name: "John",
					last_name: "Doe",
					user_email: "john@doe.com",
					user_login: "jdoe",
					role_id: 5,
					role_name: "Prez",
					role_permissions: 1,
					hierarchy: 1,
					user_promo: 2024,
				},
			],
		]); // Members query only

		const raw = {
			id: 1,
			handle: "list",
			name: "List",
			description: "Desc",
			icon: 101,
			color: "blue",
			promo: 2024,
			association_id: 10,
		};
		const result = await dbModule.getListWithMembers(raw);

		expect(result.members).toHaveLength(1);
		expect(result.members[0].user.first_name).toBe("John");
		expect(result.icon).toBe(101);
	});

	it("should handle missing icon in getBasicAssociation", async () => {
		dbModule = await import("$lib/server/database");

		const raw = {
			id: 1,
			handle: "asso",
			name: "Asso",
			description: "Desc",
			icon: null,
			color: "red",
		};
		const result = await dbModule.getBasicAssociation(raw);

		expect(result.icon).toBe(null);
	});

	it("should handle missing icon in getAssociationWithMembers", async () => {
		dbModule = await import("$lib/server/database");
		mockQuery.mockResolvedValueOnce([[]]); // Members query

		const raw = {
			id: 1,
			handle: "asso",
			name: "Asso",
			description: "Desc",
			icon: null,
			color: "red",
		};
		const result = await dbModule.getAssociationWithMembers(raw);

		expect(result.icon).toBe(null);
	});

	it("should handle missing icon in getBasicList", async () => {
		dbModule = await import("$lib/server/database");

		const raw = {
			id: 1,
			handle: "list",
			name: "List",
			description: "Desc",
			icon: null,
			color: "blue",
			promo: 2024,
			association_id: 10,
		};
		const result = await dbModule.getBasicList(raw);

		expect(result.icon).toBe(null);
	});

	it("should handle missing icon in getListWithMembers", async () => {
		dbModule = await import("$lib/server/database");
		mockQuery.mockResolvedValueOnce([[]]); // Members query

		const raw = {
			id: 1,
			handle: "list",
			name: "List",
			description: "Desc",
			icon: null,
			color: "blue",
			promo: 2024,
			association_id: 10,
		};
		const result = await dbModule.getListWithMembers(raw);

		expect(result.icon).toBe(null);
	});

	it("should return mock pool when MOCK_DB is true", async () => {
		process.env.MOCK_DB = "true";
		vi.mocked(mockDbModule.getPool).mockReturnValue({} as any);
		dbModule = await import("$lib/server/database");

		const pool = dbModule.getPool();
		expect(mockDbModule.getPool).toHaveBeenCalled();
		expect(pool).toBeDefined();
	});
});
