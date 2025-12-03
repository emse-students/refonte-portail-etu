import type { RowDataPacket } from "mysql2/promise";
import { TestData } from "../../../tests/data-factory";
import type { RawAssociation } from "$lib/databasetypes";

// Simple in-memory mock that returns TestData based on SQL content
export default async function mockDb<T = RowDataPacket>(
	strings: TemplateStringsArray,
	...values: unknown[]
) {
	const query = strings.reduce((prev, curr, i) => prev + curr + (i < values.length ? "?" : ""), "");
	const lowerQuery = query.toLowerCase().replace(/\s+/g, " ");

	console.log("[MockDB] Query:", query);

	if (lowerQuery.includes("from association")) {
		return [TestData.association] as unknown as T[];
	}

	if (lowerQuery.includes("from user")) {
		return [TestData.user] as unknown as T[];
	}

	if (lowerQuery.includes("from member")) {
		return [TestData.member] as unknown as T[];
	}

	if (lowerQuery.includes("from event")) {
		return [TestData.event] as unknown as T[];
	}

	if (lowerQuery.includes("from role")) {
		return [TestData.adminRole] as unknown as T[];
	}

	// Default empty array
	return [] as unknown as T[];
}

export function getPool() {
	return {
		query: async (q: string, ...rest: unknown[]) =>
			mockDb<RowDataPacket>([q] as unknown as TemplateStringsArray).then((res) => [res]),
	};
}

export const escape = (val: unknown) => `'${val}'`;

// Mock helpers
export async function getBasicAssociation(_raw: RawAssociation) {
	return {
		...TestData.association,
		members: [],
		icon: null,
	};
}

export async function getAssociationWithMembers(_raw: RawAssociation) {
	const memberWithUser = {
		...TestData.member,
		association_id: TestData.member.association_id,
		list_id: TestData.member.list_id,
		user: TestData.user,
		role: TestData.adminRole,
	};

	return {
		...TestData.association,
		members: [memberWithUser],
		icon: null,
	};
}
