import { json, type RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import Permission from "$lib/permissions";
import {
	requireAuth,
	getAuthorizedAssociationIds,
	checkAssociationPermission,
	checkListPermission,
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

		await db`
        INSERT INTO member (user_id, association_id, role_name, permissions, hierarchy, visible)
        VALUES (${user_id}, ${association_id || null}, ${role_name}, ${permissions}, ${hierarchy}, ${visible !== false})
    `;

		// Ensure the insert is committed before returning
		await new Promise((resolve) => setTimeout(resolve, 50));
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

		await db`
        INSERT INTO member (user_id, list_id, role_name, permissions, hierarchy, visible)
        VALUES (${user_id}, ${list_id || null}, ${role_name}, ${permissions}, ${hierarchy}, ${visible !== false})
    `;

		// Ensure the insert is committed before returning
		await new Promise((resolve) => setTimeout(resolve, 50));
	} else {
		return json({ error: "association_id or list_id is required" }, { status: 400 });
	}

	return json(
		{ success: true },
		{
			status: 201,
		}
	);
};

export const PUT = async (event: RequestEvent) => {
	const body = await event.request.json();
	const { id, user_id, association_id, role_name, permissions, hierarchy, list_id, visible } = body;

	if (!id || !association_id) {
		return json({ error: "id and association_id are required" }, { status: 400 });
	}

	// Récupérer le membre existant pour vérifier son association
	const existingMember = await db`
        SELECT association_id FROM member WHERE id = ${id}
    `.then((rows) => rows?.[0]);

	if (!existingMember) {
		return json({ error: "Member not found" }, { status: 404 });
	}

	// Vérifier la permission pour l'association actuelle du membre
	const authCheck = await checkAssociationPermission(
		event,
		existingMember.association_id,
		Permission.MANAGE
	);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	// Si on change l'association, vérifier aussi la permission pour la nouvelle association
	if (existingMember.association_id !== association_id) {
		const newAssocAuthCheck = await checkAssociationPermission(
			event,
			association_id,
			Permission.MANAGE
		);
		if (!newAssocAuthCheck.authorized) {
			return json(
				{
					error: "Forbidden",
					message: "Vous n'avez pas la permission de déplacer ce membre vers cette association",
				},
				{ status: 403 }
			);
		}
	}

	const targetAssociationId = association_id || existingMember.association_id;

	let maxPermissions = 0;
	if (authCheck.user.admin) {
		maxPermissions = Permission.ADMIN;
	} else {
		const membership = authCheck.user.memberships.find(
			(m) => m.association_id === targetAssociationId
		);
		if (membership) {
			maxPermissions = membership.permissions;
		}
	}

	if (permissions > maxPermissions) {
		return json(
			{
				error: "Forbidden",
				message: "Vous ne pouvez pas assigner un rôle avec plus de permissions que vous n'en avez",
			},
			{ status: 403 }
		);
	}

	await db`
        UPDATE member 
        SET user_id = ${user_id}, association_id = ${association_id || null}, 
            role_name = ${role_name}, permissions = ${permissions}, hierarchy = ${hierarchy}, list_id = ${list_id || null}, visible = ${visible !== false}
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
