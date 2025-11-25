import { json, type RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import Permission, { hasPermission } from "$lib/permissions";
import { requireAuth } from "$lib/server/auth-middleware";

export const POST = async (event: RequestEvent) => {
	const user = await requireAuth(event);
	if (!user) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	// Only global event managers can finalize submission
	if (!hasPermission(user.permissions, Permission.EVENTS)) {
		return json({ error: "Forbidden" }, { status: 403 });
	}

	try {
		// 1. Close event submission
		await db`
			INSERT INTO config (key_name, value) VALUES ('event_submission_open', 'false')
			ON DUPLICATE KEY UPDATE value = 'false'
		`;

		// 2. Validate all pending events
		// We validate everything that is currently not validated.
		// In a more complex system, we might want to only validate events for the upcoming period,
		// but for now "validate all submitted events" implies all pending proposals.
		await db`
			UPDATE event 
			SET validated = true 
			WHERE validated = false
		`;

		return json({
			success: true,
			message: "Soumission fermée et événements validés.",
		});
	} catch (e) {
		console.error("Error finalizing submission:", e);
		return json({ error: "Internal Server Error" }, { status: 500 });
	}
};
