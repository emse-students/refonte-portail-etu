import { createPool, type Pool, type RowDataPacket } from "mysql2/promise";
import { env } from "$env/dynamic/private";
import type { Association, List, Member, RawAssociation, RawList } from "$lib/databasetypes";
import * as mockDbModule from "./database-mock";
import logger from "$lib/server/logger";

const USE_MOCK = env.MOCK_DB === "true";

let pool: Pool | null = null;

function ensurePool() {
	if (USE_MOCK) return;
	if (!pool) {
		pool = createPool({
			host: env.DB_HOST,
			user: env.DB_USER,
			password: env.DB_PASSWORD,
			database: env.DB_NAME,
			port: Number(env.DB_PORT) || 3306,
			connectionLimit: 10,
		});
	}
}

export default async function db<T = RowDataPacket>(
	strings: TemplateStringsArray,
	...values: unknown[]
) {
	if (USE_MOCK) {
		return mockDbModule.default<T>(strings, ...values);
	}
	const query = strings.reduce((prev, curr, i) => prev + curr + (i < values.length ? "?" : ""), "");
	logger.debug(`DB Query: ${query}`, { values });
	const rows = (await getPool().query<RowDataPacket[]>(query, values))[0];
	return rows as T[];
}

export function getPool(): Pool {
	if (USE_MOCK) {
		return mockDbModule.getPool() as unknown as Pool;
	}
	ensurePool();
	return pool as Pool;
}

export { escape } from "mysql2/promise";

export async function getBasicAssociation(raw: RawAssociation): Promise<Association> {
	if (USE_MOCK) {
		return mockDbModule.getBasicAssociation(raw);
	}
	return {
		id: raw.id,
		handle: raw.handle,
		name: raw.name,
		description: raw.description,
		members: [],
		icon: raw.icon,
		color: raw.color,
	};
}

export async function getAssociationWithMembers(raw: RawAssociation): Promise<Association> {
	if (USE_MOCK) {
		return mockDbModule.getAssociationWithMembers(raw);
	}
	const membersData = (await db`
        SELECT m.id as member_id, m.visible, u.id as user_id, u.first_name as first_name, u.last_name as last_name, u.email as user_email, u.login as user_login, 
               m.role_name as role_name, m.permissions as role_permissions, m.hierarchy as hierarchy, u.promo as user_promo
        FROM member m
        JOIN user u ON m.user_id = u.id
        WHERE m.association_id = ${raw.id}
    `) as {
		member_id: number;
		visible: boolean;
		user_id: number;
		first_name: string;
		last_name: string;
		user_email: string;
		user_login: string;
		role_name: string;
		role_permissions: number;
		hierarchy: number;
		user_promo: number;
	}[];
	const members = membersData.map(
		(m) =>
			({
				user: {
					id: m.user_id,
					first_name: m.first_name,
					last_name: m.last_name,
					email: m.user_email,
					login: m.user_login,
					promo: m.user_promo,
				},
				role_name: m.role_name,
				permissions: m.role_permissions,
				hierarchy: m.hierarchy,
				id: m.member_id,
				visible: m.visible,
				association_id: raw.id,
				list_id: null,
			}) as Member
	);

	return {
		id: raw.id,
		handle: raw.handle,
		name: raw.name,
		description: raw.description,
		members: members,
		icon: raw.icon,
		color: raw.color,
	};
}

export async function getBasicList(raw: RawList): Promise<List> {
	return {
		id: raw.id,
		handle: raw.handle,
		name: raw.name,
		description: raw.description,
		members: [],
		icon: raw.icon,
		color: raw.color,
		promo: raw.promo,
		association_id: raw.association_id,
	};
}

export async function getListWithMembers(raw: RawList): Promise<List> {
	const membersData = (await db`
        SELECT m.id as member_id, m.visible, u.id as user_id, u.first_name as first_name, u.last_name as last_name, u.email as user_email, u.login as user_login, 
               m.role_name as role_name, m.permissions as role_permissions, m.hierarchy as hierarchy, u.promo as user_promo
        FROM member m
        JOIN user u ON m.user_id = u.id
        WHERE m.list_id = ${raw.id}
    `) as {
		member_id: number;
		visible: boolean;
		user_id: number;
		first_name: string;
		last_name: string;
		user_email: string;
		user_login: string;
		role_id: number;
		role_name: string;
		role_permissions: number;
		hierarchy: number;
		user_promo: number;
	}[];
	const members = membersData.map(
		(m) =>
			({
				user: {
					id: m.user_id,
					first_name: m.first_name,
					last_name: m.last_name,
					email: m.user_email,
					login: m.user_login,
					promo: m.user_promo,
				},
				role_name: m.role_name,
				permissions: m.role_permissions,
				hierarchy: m.hierarchy,
				id: m.member_id,
				visible: m.visible,
				list_id: raw.id,
				association_id: null,
			}) as Member
	);

	console.log(`Fetched ${members.length} members for list ${raw.handle}`);

	return {
		id: raw.id,
		handle: raw.handle,
		name: raw.name,
		description: raw.description,
		members: members,
		icon: raw.icon,
		color: raw.color,
		association_id: raw.association_id,
		promo: raw.promo,
	};
}
