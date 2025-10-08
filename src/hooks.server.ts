import { handle as authHandle } from '$lib/auth';
import db from "$lib/database";

export const handle = async ({ event, resolve }) => {
	// Tracking page view
	try {
		const path = event.url.pathname;
		const session = event.locals?.auth && await event.locals.auth();
		const userId = session?.user?.id || null;
		db`
			INSERT INTO page_views (path, user_id)
			VALUES (${path}, ${userId})
		`;
	} catch (e) {
		// Ignore tracking errors
	}
	return authHandle({ event, resolve });
}