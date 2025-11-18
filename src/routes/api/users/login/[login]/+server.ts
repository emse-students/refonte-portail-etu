export const prerender = false;

import type { Member, RawUser } from "$lib/databasetypes";
import db from "$lib/server/database";
import { json, type RequestEvent } from '@sveltejs/kit'



export const GET = async (event: RequestEvent) => {
    const login = event.params.login;
    const fullUser = event.url.searchParams.get('fullUser');



    const user = await db<RawUser>`SELECT * FROM user WHERE login = ${login}`.then(rows => rows?.[0]) || null;

    if (fullUser === 'true' && user) {
        // Fetch memberships (type Member[]) for the user with a JOIN to get association and role details
        const membershipsData = await db`
            SELECT 
                m.id as member_id, 
                m.visible, 
                m.association_id,
                u.id as user_id, 
                u.first_name, 
                u.last_name, 
                u.email as user_email, 
                u.login as user_login,
                u.permissions as user_permissions,
                r.id as role_id, 
                r.name as role_name, 
                r.permissions as role_permissions, 
                r.hierarchy as hierarchy
            FROM member m
            JOIN user u ON m.user_id = u.id
            JOIN role r ON m.role_id = r.id
            WHERE m.user_id = ${user.id}
        ` as {
            member_id: number;
            visible: boolean;
            association_id: number;
            user_id: number;
            first_name: string;
            last_name: string;
            user_email: string;
            user_login: string;
            user_permissions: number;
            role_id: number;
            role_name: string;
            role_permissions: number;
            hierarchy: number;
        }[];

        const memberships: Member[] = membershipsData.map((m) => ({
            id: m.member_id,
            visible: m.visible,
            association: m.association_id,
            user: {
                id: m.user_id,
                first_name: m.first_name,
                last_name: m.last_name,
                email: m.user_email,
                login: m.user_login,
                permissions: m.user_permissions,
            },
            role: {
                id: m.role_id,
                name: m.role_name,
                permissions: m.role_permissions,
                hierarchy: m.hierarchy,
            }
        }));

        return json({ user: { ...user, memberships } }, { status: 200 });
    }

    if (user) {
        return json({ user }, { status: 200 });
    } else {
        return json({ error: 'User not found' }, { status: 404 });
    }
}