import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import db, { getPool } from "$lib/server/database";
import { requireAuth } from "$lib/server/auth-middleware";
import Permission, { hasPermission } from "$lib/permissions";
import type { ConfigRow } from "$lib/databasetypes";

// Ensure table exists
async function ensureConfigTable() {
	await getPool().query(`
		CREATE TABLE IF NOT EXISTS config (
			key_name VARCHAR(255) PRIMARY KEY,
			value VARCHAR(255)
		)
	`);
}

export const GET = async () => {
	await ensureConfigTable();
	const rows = await db<ConfigRow>`SELECT key_name, value FROM config`;
	const config = rows.reduce((acc: Record<string, string>, row: ConfigRow) => {
		acc[row.key_name] = row.value;
		return acc;
	}, {});
	return json(config);
};

export const POST = async (event: RequestEvent) => {
	const user = await requireAuth(event);
	if (!user) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	// Only global admins can change config
	if (!user.admin && !hasPermission(user.permissions, Permission.ADMIN)) {
		// Check if they are event manager (global EVENTS permission)
		// The prompt says "The user with global Event permissions (ie event manager) can open event submission"
		if (!hasPermission(user.permissions, Permission.MANAGE)) {
			return json({ error: "Forbidden" }, { status: 403 });
		}
		// If they have global EVENTS permission, we check if they are restricted to specific associations
		// But wait, permissions are bitmasks. If user.permissions has EVENTS bit set, it's global unless we interpret it differently.
		// In this system, it seems global permissions are stored in user.permissions.
		// Association permissions are in user.memberships[].role.permissions.
		// So if user.permissions has EVENTS, they are a global event manager.
	}

	const body = await event.request.json();
	const { key, value } = body;

	if (!key) {
		return json({ error: "Key is required" }, { status: 400 });
	}

	await ensureConfigTable();

	// Upsert
	await db`
		INSERT INTO config (key_name, value) VALUES (${key}, ${String(value)})
		ON DUPLICATE KEY UPDATE value = ${String(value)}
	`;

	return json({ success: true });
};
