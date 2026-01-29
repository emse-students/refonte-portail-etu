import { json, type RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import Permission from "$lib/permissions";
import { checkAdmin } from "$lib/server/auth-middleware";
import type { RawUser } from "$lib/databasetypes";

export const GET = async () => {
	const users = await db<RawUser & { max_role_permissions: number | null }>`
        SELECT
            u.id, u.first_name, u.last_name, u.email, u.login, u.promo, u.admin,
            MAX(r.permissions) as max_role_permissions
        FROM
            user u
        LEFT JOIN member m ON u.id = m.user_id
        LEFT JOIN role r ON m.role_id = r.id
        GROUP BY u.id
        ORDER BY u.id DESC
    `;

	// Map max_role_permissions to global permissions logic
	const usersWithPermissions = users.map((u) => {
		let globalPermissions = 0;
		if (u.max_role_permissions === Permission.ADMIN) {
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
	const authCheck = await checkAdmin(event);
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
	const authCheck = await checkAdmin(event);
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
	const authCheck = await checkAdmin(event);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	const body = await event.request.json();
	const { id } = body;

	await db`DELETE FROM user WHERE id = ${id}`;

	return json({ success: true });
};
