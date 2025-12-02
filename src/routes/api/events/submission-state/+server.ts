import { redirect, type RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import { requireAuth } from "$lib/server/auth-middleware";

export const GET = async (event: RequestEvent) => {
	const user = await requireAuth(event);
	if (!user) {
		throw redirect(302, "/auth/login");
	}

	const configRows = await db`SELECT value FROM config WHERE key_name = 'event_submission_open'`;
	const isOpen = configRows.length > 0 && configRows[0].value === "true";

	return new Response(JSON.stringify({ open: isOpen }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
