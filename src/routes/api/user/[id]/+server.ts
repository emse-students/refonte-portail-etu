import { type RawUser } from "$lib/databasetypes";
import db from "$lib/server/database";
import { json, type RequestEvent } from '@sveltejs/kit'

export const GET = async (event: RequestEvent) => {
    const id = event.params.id;
    const withPermissions = event.url.searchParams.get('withPermissions');



    const user = await db<RawUser>`SELECT id, username, email, login FROM users WHERE id = ${id}`.then(rows => rows?.[0]) || null;


    if (withPermissions) {
        if (user) {
            const permissions = await db<RawUser>`
                SELECT permissions from users WHERE id = ${id}
            `.then(rows => rows[0]?.permissions || 0);
            user.permissions = permissions;
        }
    }

    if (user) {
        return json({ user }, { status: 200 });
    } else {
        return json({ error: 'User not found' }, { status: 404 });
    }
}
