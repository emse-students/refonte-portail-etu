import { createPool, type Pool, type RowDataPacket } from "mysql2/promise";
import "dotenv/config";
import type { Association, RawAssociation } from "$lib/databasetypes";

let pool: Pool | null = null;

export default async function db<T = any>(strings: TemplateStringsArray, ...values: any[]) {

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

    const query = strings.reduce((prev, curr, i) => prev + curr + (i < values.length ? "?" : ""), "");
    const [rows] = await pool.query<RowDataPacket[]>(query, values);
    return rows as T[];
}


export async function getBasicAssociation(raw: RawAssociation): Promise<Association> {

    const iconUrl = (await db`SELECT url FROM image WHERE id = ${raw.icon}` as { url: string }[])[0]?.url || "";
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
        SELECT m.id as member_id, m.visible, u.id as user_id, u.name as user_name, u.email as user_email, u.login as user_login, 
               r.id as role_id, r.name as role_name, r.permissions as role_permissions
        FROM members m
        JOIN users u ON m.user_id = u.id
        JOIN roles r ON m.role_id = r.id
        WHERE m.association_id = ${raw.id}
    ` as {
        member_id: number;
        visible: boolean;
        user_id: number;
        user_name: string;
        user_email: string;
        user_login: string;
        role_id: number;
        role_name: string;
        role_permissions: number;
    }[];
    const members = membersData.map((m) => ({
        user: {
            id: m.user_id,
            name: m.user_name,
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
    }));
    
    const iconUrl = (await db`SELECT url FROM image WHERE id = ${raw.icon}` as { url: string }[])[0]?.url || "";

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
