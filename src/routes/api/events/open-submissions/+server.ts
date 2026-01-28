import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { requirePermission, forbiddenResponse } from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";
import db from "$lib/server/database";

export async function POST(event: RequestEvent) {
	const user = await requirePermission(event, Permission.MANAGE);
	if (!user) {
		return forbiddenResponse(
			"Vous n'avez pas la permission d'ouvrir les soumissions d'événements."
		);
	}

	// Check if the config key exists
	const existing = await db`SELECT key_name FROM config WHERE key_name = 'event_submission_open'`;

	if (existing.length > 0) {
		await db`UPDATE config SET value = 'true' WHERE key_name = 'event_submission_open'`;
	} else {
		await db`INSERT INTO config (key_name, value) VALUES ('event_submission_open', 'true')`;
	}

	return json({
		success: true,
		message: "Les soumissions d'événements sont maintenant ouvertes.",
	});
}
