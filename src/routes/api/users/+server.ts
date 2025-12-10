import { json, type RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import Permission from "$lib/permissions";
import { checkPermission } from "$lib/server/auth-middleware";
import type { RawUser } from "$lib/databasetypes";

export const GET = async () => {
	const users = await db<
		RawUser & { max_role_permissions: number | null; roles_summary: string | null }
	>`
        SELECT
            u.id, u.first_name, u.last_name, u.email, u.login, u.promo,
            MAX(r.permissions) as max_role_permissions,
            GROUP_CONCAT(
                CONCAT(r.name, IF(a.name IS NOT NULL, CONCAT(' (', a.name, ')'), ''))
                SEPARATOR ', '
            ) as roles_summary
        FROM
            user u
        LEFT JOIN member m ON u.id = m.user_id
        LEFT JOIN role r ON m.role_id = r.id
        LEFT JOIN association a ON m.association_id = a.id
        GROUP BY u.id
        ORDER BY u.id DESC
    `;

	// Map max_role_permissions to global permissions logic
	const usersWithPermissions = users.map((u) => {
		let globalPermissions = 0;
		if (u.max_role_permissions === Permission.SITE_ADMIN) {
			globalPermissions = Permission.SITE_ADMIN;
		} else if (u.max_role_permissions === Permission.ADMIN) {
			globalPermissions = Permission.ADMIN;
		}
		return {
			...u,
			permissions: globalPermissions,
		};
	});

	return json(usersWithPermissions);
};

export const POST = async (event: RequestEvent) => {
	// Création d'utilisateur nécessite SITE_ADMIN
	const authCheck = await checkPermission(event, Permission.SITE_ADMIN);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	const body = await event.request.json();
	const { first_name, last_name, email, login, promo } = body;

	await db`
        INSERT INTO user (first_name, last_name, email, login, promo)
        VALUES (${first_name}, ${last_name}, ${email}, ${login}, ${promo || null})
    `;

	return new Response(JSON.stringify({ success: true }), {
		status: 201,
		headers: { "Content-Type": "application/json" },
	});
};

export const PUT = async (event: RequestEvent) => {
	// Modification d'utilisateur nécessite SITE_ADMIN
	const authCheck = await checkPermission(event, Permission.SITE_ADMIN);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	const body = await event.request.json();
	const { id, first_name, last_name, email, login, promo } = body;

	await db`
        UPDATE user 
        SET first_name = ${first_name}, last_name = ${last_name}, email = ${email}, 
            login = ${login}, promo = ${promo}
        WHERE id = ${id}
    `;

	return json({ success: true });
};

export const DELETE = async (event: RequestEvent) => {
	// Suppression d'utilisateur nécessite SITE_ADMIN
	const authCheck = await checkPermission(event, Permission.SITE_ADMIN);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	const body = await event.request.json();
	const { id } = body;

	await db`DELETE FROM user WHERE id = ${id}`;

	return json({ success: true });
};
