import { createPool, type Pool, type RowDataPacket } from "mysql2/promise";
import "dotenv/config";
import type { Association, Member, RawAssociation } from "$lib/databasetypes";

let pool: Pool | null = null;

function ensurePool() {
    if (!pool) {
        pool = createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT) || 3306,
            connectionLimit: 10,
        });
    }
}

export default async function db<T = any>(strings: TemplateStringsArray, ...values: any[]) {
    const query = strings.reduce((prev, curr, i) => prev + curr + (i < values.length ? "?" : ""), "");
    const rows = (await getPool().query<RowDataPacket[]>(query, values))[0];
    return rows as T[];
}

export function getPool(): Pool {
    ensurePool();
    return pool as Pool;
}

export { escape } from "mysql2/promise";


export async function getBasicAssociation(raw: RawAssociation): Promise<Association> {

    const iconUrl = (await db`SELECT filename FROM image WHERE id = ${raw.icon}` as { filename: string }[])[0]?.filename || "";
    return {
        id: raw.id,
        handle: raw.handle,
        name: raw.name,
        description: raw.description,
        members: [],
        is_list: raw.is_list,
        icon: iconUrl,
        color: raw.color,
    };
}

export async function getAssociationWithMembers(raw: RawAssociation): Promise<Association> {

    const membersData = await db`
        SELECT m.id as member_id, m.visible, u.id as user_id, u.first_name as first_name, u.last_name as last_name, u.email as user_email, u.login as user_login, 
               r.id as role_id, r.name as role_name, r.permissions as role_permissions
        FROM member m
        JOIN user u ON m.user_id = u.id
        JOIN role r ON m.role_id = r.id
        WHERE m.association_id = ${raw.id}
    ` as {
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
    }[];
    const members = membersData.map((m) => ({
        user: {
            id: m.user_id,
            first_name: m.first_name,
            last_name: m.last_name,
            email: m.user_email,
            login: m.user_login,
            permissions: 0, // Not needed here
        },
        role: {
            id: m.role_id,
            name: m.role_name,
            permissions: m.role_permissions
        },
        visible: m.visible,
        association: raw.id
    }) as Member);
    
    const iconUrl = (await db`SELECT filename FROM image WHERE id = ${raw.icon}` as { filename: string }[])[0]?.filename || "";

    return {
        id: raw.id,
        handle: raw.handle,
        name: raw.name,
        description: raw.description,
        members: members,
        is_list: raw.is_list,
        icon: iconUrl,
        color: raw.color,
    };
}
