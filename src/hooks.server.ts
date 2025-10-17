import { handle as authHandle } from "$lib/server/auth";
import db from "$lib/server/database";

export const handle = async ({ event, resolve }) => {
	// Tracking page view
	try {
		const path = event.url.pathname;
		const session = event.locals?.auth && (await event.locals.auth());
		const userId = session?.user?.id || "anonymous";
		db`
			INSERT INTO page_views (path, user_id)
			VALUES (${path}, ${userId})
		`;
	} catch (e) {
		// Ignore tracking errors
	}

	return authHandle({ event, resolve });
};
