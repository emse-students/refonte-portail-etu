import { SQL, env } from "bun";
import type { Association, RawAssociation } from "$lib/databasetypes";

const db = new SQL({
    adapter: "mysql",
    hostname: env.DB_HOST,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: Number(env.DB_PORT) || 3306
});

export default db;


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
