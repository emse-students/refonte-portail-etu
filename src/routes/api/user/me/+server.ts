import db from '$lib/server/database';
import { json, type RequestEvent } from '@sveltejs/kit';




export const GET = async (event: RequestEvent) => {
    if (event.locals.user) {
        //const user = await db<App.Locals["user"]>`SELECT id, username, email, created_at FROM users WHERE id = ${event.locals.user.id}` || null;
        const user = { id: 1, username: "example" }; // Mock user data for demonstration
        
        if (user) {
            return json({ user }, { status: 200 });
        } else {
            return json({ error: 'User not found' }, { status: 404 });
        }
    } else {
        return json({ error: 'Not authenticated' }, { status: 401 });
    }
}
