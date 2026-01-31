import type { Member, RawUser } from "$lib/databasetypes";
import db from "$lib/server/database";
import { json, type RequestEvent } from "@sveltejs/kit";

export const GET = async (event: RequestEvent) => {
	const id = event.params.id;
	const fullUser = event.url.searchParams.get("fullUser");

	const user =
		(await db<RawUser>`SELECT * FROM user WHERE id = ${id}`.then((rows) => rows?.[0])) || null;

	if (fullUser === "true" && user) {
		// Fetch memberships (type Member[]) for the user with a JOIN to get association and role details
		const membershipsData = (await db`
            SELECT 
                m.id as member_id, 
                m.visible, 
                m.association_id,
                m.list_id,
                u.id as user_id, 
                u.first_name, 
                u.last_name, 
                u.email as user_email, 
                u.login as user_login,
                m.role_name, 
                m.permissions as role_permissions, 
                m.hierarchy,
				u.admin as admin,
                u.promo as user_promo
            FROM member m
            JOIN user u ON m.user_id = u.id
            WHERE m.user_id = ${id}
        `) as {
			member_id: number;
			visible: boolean;
			association_id: number | null;
			list_id: number | null;
			user_id: number;
			first_name: string;
			last_name: string;
			user_email: string;
			user_login: string;
			role_name: string;
			role_permissions: number;
			hierarchy: number;
			user_promo: number;
			admin: boolean;
		}[];

		const memberships: Member[] = membershipsData.map((m) => ({
			id: m.member_id,
			visible: m.visible,
			association_id: m.association_id,
			list_id: m.list_id,
			user: user!,
			role_name: m.role_name,
			permissions: m.role_permissions,
			hierarchy: m.hierarchy,
		}));

		return json({ user: { ...user, memberships } }, { status: 200 });
	}

	if (user) {
		return json({ user }, { status: 200 });
	} else {
		return json({ error: "User not found" }, { status: 404 });
	}
};
