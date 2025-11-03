import db from "$lib/server/database";
import { json, type RequestEvent } from '@sveltejs/kit'

export const GET = async (event: RequestEvent) => {
    const id = event.params.id;
    const withPermissions = event.url.searchParams.get('withPermissions');



    const user = await db`SELECT id, username, email, created_at FROM users WHERE id = ${id}` || null;
    if (withPermissions) {
        if (user) {
            const permissions = await db`
                SELECT p.id, p.name
                FROM permissions p
                JOIN user_permissions up ON p.id = up.permission_id
                WHERE up.user_id = ${id}
            `;
            (user as any).permissions = permissions;
        }
    }

    if (user) {
        return json({ user }, { status: 200 });
    } else {
        return json({ error: 'User not found' }, { status: 404 });
    }
}
