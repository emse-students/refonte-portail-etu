import { json, type RequestEvent } from "@sveltejs/kit";
import db, { getPool } from "$lib/server/database";
import Permission from "$lib/permissions";
import {
	requireAuth,
	getAuthorizedAssociationIds,
	checkAssociationPermission,
	checkListPermission,
	hasAssociationPermission,
	hasListPermission,
} from "$lib/server/auth-middleware";

export const GET = async (event: RequestEvent) => {
	// Liste des membres : filtrer selon les associations autorisées
	const user = await requireAuth(event);
	if (!user) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	const authorizedAssociations = getAuthorizedAssociationIds(user, Permission.MANAGE);

	// Si null, l'utilisateur est admin et peut tout voir
	if (authorizedAssociations === null) {
		const members = await db`
            SELECT
                m.id, m.visible, m.user_id, m.association_id, m.list_id,
                u.first_name, u.last_name, u.email,
                a.name as association_name,
                l.name as list_name,
                m.role_name as role_name
            FROM
                member m
            LEFT JOIN user u ON m.user_id = u.id
            LEFT JOIN association a ON m.association_id = a.id
            LEFT JOIN list l ON m.list_id = l.id
            ORDER BY m.id DESC
        `;
		return json(members);
	}

	// Sinon, filtrer par les associations autorisées
	if (authorizedAssociations.length === 0) {
		return json([]);
	}

	const members = await db`
        SELECT
            m.id, m.visible, m.user_id, m.association_id, m.list_id,
            u.first_name, u.last_name, u.email,
            a.name as association_name,
            l.name as list_name,
            m.role_name as role_name
        FROM
            member m
        LEFT JOIN user u ON m.user_id = u.id
        LEFT JOIN association a ON m.association_id = a.id
        LEFT JOIN list l ON m.list_id = l.id
        WHERE m.association_id IN (${authorizedAssociations})
        ORDER BY m.id DESC
    `;

	return json(members);
};

export const POST = async (event: RequestEvent) => {
	const body = await event.request.json();
	const { user_id, association_id, role_name, permissions, hierarchy, list_id, visible } = body;

	if (association_id) {
		// Vérifier que l'utilisateur a la permission MANAGE pour cette association spécifique
		const authCheck = await checkAssociationPermission(event, association_id, Permission.MANAGE);
		if (!authCheck.authorized) {
			return authCheck.response;
		}

		let maxPermissions = 0;
		if (authCheck.user.admin) {
			maxPermissions = Permission.ADMIN;
		} else {
			const membership = authCheck.user.memberships.find(
				(m) => m.association_id === association_id
			);
			if (membership) {
				maxPermissions = membership.permissions;
			}
		}

		if (permissions > maxPermissions) {
			return json(
				{
					error: "Forbidden",
					message:
						"Vous ne pouvez pas assigner un rôle avec plus de permissions que vous n'en avez",
				},
				{ status: 403 }
			);
		}

		const [result] = await getPool().query(
			"INSERT INTO member (user_id, association_id, role_name, permissions, hierarchy, visible) VALUES (?, ?, ?, ?, ?, ?)",
			[user_id, association_id || null, role_name, permissions, hierarchy, visible !== false]
		);

		// Ensure the insert is committed before returning
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Récupérer l'ID du membre inséré
		const insertId = (result as { insertId: number }).insertId;

		return json(
			{ success: true, id: insertId },
			{
				status: 201,
			}
		);
	} else if (list_id) {
		const authCheck = await checkListPermission(event, list_id, Permission.MANAGE);
		if (!authCheck.authorized) {
			return authCheck.response;
		}

		let maxPermissions = 0;
		if (authCheck.user.admin) {
			maxPermissions = Permission.ADMIN;
		} else {
			const membership = authCheck.user.memberships.find((m) => m.list_id === list_id);
			if (membership) {
				maxPermissions = membership.permissions;
			}
		}

		if (permissions > maxPermissions) {
			return json(
				{
					error: "Forbidden",
					message:
						"Vous ne pouvez pas assigner un rôle avec plus de permissions que vous n'en avez",
				},
				{ status: 403 }
			);
		}

		const [result] = await getPool().query(
			"INSERT INTO member (user_id, list_id, role_name, permissions, hierarchy, visible) VALUES (?, ?, ?, ?, ?, ?)",
			[user_id, list_id || null, role_name, permissions, hierarchy, visible !== false]
		);

		// Ensure the insert is committed before returning
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Récupérer l'ID du membre inséré
		const insertId = (result as { insertId: number }).insertId;

		return json(
			{ success: true, id: insertId },
			{
				status: 201,
			}
		);
	} else {
		return json({ error: "association_id or list_id is required" }, { status: 400 });
	}
};

export const PUT = async (event: RequestEvent) => {
	const body = await event.request.json();
	const { id, role_name, permissions, hierarchy, visible } = body;

	if (!id) {
		return json({ error: "id is required" }, { status: 400 });
	}

	const existingMember = await db`
			SELECT * FROM member WHERE id = ${id}
		`.then((rows) => rows?.[0]);

	if (!existingMember) {
		return json({ error: "Member not found" }, { status: 404 });
	}

	if (existingMember.association_id !== null) {
		// Vérifier la permission pour l'association actuelle du membre
		const authCheck = await checkAssociationPermission(
			event,
			existingMember.association_id,
			Permission.MANAGE
		);
		if (!authCheck.authorized) {
			return authCheck.response;
		}

		if (!hasAssociationPermission(authCheck.user, existingMember.association_id, permissions)) {
			return json(
				{
					error: "Forbidden",
					message:
						"Vous ne pouvez pas assigner un rôle avec plus de permissions que vous n'en avez",
				},
				{ status: 403 }
			);
		}
	} else if (existingMember.list_id !== null) {
		// Vérifier la permission pour la liste actuelle du membre
		const authCheck = await checkListPermission(event, existingMember.list_id, Permission.MANAGE);
		if (!authCheck.authorized) {
			return authCheck.response;
		}

		if (!hasListPermission(authCheck.user, existingMember.list_id, permissions)) {
			return json(
				{
					error: "Forbidden",
					message:
						"Vous ne pouvez pas assigner un rôle avec plus de permissions que vous n'en avez",
				},
				{ status: 403 }
			);
		}
	} else {
		return json(
			{ error: "Member is not associated with an association or a list" },
			{ status: 400 }
		);
	}

	await db`
			UPDATE member 
			SET role_name = ${role_name}, permissions = ${permissions}, hierarchy = ${hierarchy}, visible = ${visible !== false}
			WHERE id = ${id}
		`;

	// Ensure the update is committed before returning
	await new Promise((resolve) => setTimeout(resolve, 50));

	return json({ success: true });
};

export const DELETE = async (event: RequestEvent) => {
	const body = await event.request.json();
	const { id } = body;

	if (!id) {
		return json({ error: "id is required" }, { status: 400 });
	}

	// Récupérer le membre pour vérifier son association
	const existingMember = await db`
        SELECT association_id FROM member WHERE id = ${id}
    `.then((rows) => rows?.[0]);

	if (!existingMember) {
		return json({ error: "Member not found" }, { status: 404 });
	}

	// Vérifier la permission pour l'association du membre
	const { checkAssociationPermission } = await import("$lib/server/auth-middleware");
	const authCheck = await checkAssociationPermission(
		event,
		existingMember.association_id,
		Permission.MANAGE
	);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	await db`DELETE FROM member WHERE id = ${id}`;

	// Ensure the delete is committed before returning
	await new Promise((resolve) => setTimeout(resolve, 50));

	return json({ success: true });
};
