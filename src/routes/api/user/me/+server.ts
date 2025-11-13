import { resolve } from '$app/paths';
import type { User } from '$lib/databasetypes';
import { json, type RequestEvent } from '@sveltejs/kit';




export const GET = async (event: RequestEvent) => {
    if (event.locals.user) {
        const userId = event.locals.user.id;
        
        const user: User = await fetch(resolve('/api/user/') + userId + '?withPermissions=true')
            .then(res => res.json())
            .catch(() => null);
        
        return json({ user });
    } else {
        return json({ error: 'Not authenticated' }, { status: 401 });
    }
}
