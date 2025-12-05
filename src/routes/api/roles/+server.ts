import { json, type RequestEvent } from "@sveltejs/kit";
import db, { getPool } from "$lib/server/database";
import type { RawRole } from "$lib/databasetypes";
import Permission, { hasPermission } from "$lib/permissions";
import { checkPermission, checkAssociationPermission } from "$lib/server/auth-middleware";
import type { ResultSetHeader } from "mysql2";

export const GET = async () => {
	// Liste des rôles accessible à tous les utilisateurs authentifiés
	const roles = await db<RawRole>`
        SELECT
            id, name, hierarchy, permissions
        FROM
            role
        ORDER BY hierarchy DESC
    `;

	return json(roles);
};

export const POST = async (event: RequestEvent) => {
	const body = await event.request.json();
	// Note: hierarchy >= 6 est considéré comme "Bureau" dans l'interface
	const { name, hierarchy, permissions, association_id } = body;

	let maxPermissions = 0;

	if (association_id) {
		// Si un ID d'association est fourni, on vérifie les droits dans cette association
		const authCheck = await checkAssociationPermission(event, association_id, Permission.ROLES);
		if (!authCheck.authorized) {
			return authCheck.response;
		}

		// Récupérer le niveau de permission de l'utilisateur dans cette association
		const membership = authCheck.user.memberships.find((m) => m.association_id === association_id);
		// Si l'utilisateur est admin global, il a toutes les permissions
		if (hasPermission(authCheck.user.permissions, Permission.ADMIN)) {
			maxPermissions = Permission.SITE_ADMIN; // Ou une autre valeur max
		} else if (membership) {
			maxPermissions = membership.role.permissions;
		}
	} else {
		// Sinon, création de rôle nécessite ROLES permission globale
		const authCheck = await checkPermission(event, Permission.ROLES);
		if (!authCheck.authorized) {
			return authCheck.response;
		}
		maxPermissions = authCheck.user.permissions;
	}

	// Vérifier que l'utilisateur ne crée pas un rôle avec plus de permissions qu'il n'en a
	if (permissions > maxPermissions) {
		return new Response(
			JSON.stringify({
				error: "Forbidden",
				message: "Vous ne pouvez pas créer un rôle avec plus de permissions que vous n'en avez",
			}),
			{
				status: 403,
				headers: { "Content-Type": "application/json" },
			}
		);
	}

	const result = await getPool().query<ResultSetHeader>(
		`INSERT INTO role (name, hierarchy, permissions) VALUES (?, ?, ?)`,
		[name, hierarchy, permissions]
	);
	return new Response(JSON.stringify({ success: true, id: result[0].insertId }), {
		status: 201,
		headers: { "Content-Type": "application/json" },
	});
};

export const PUT = async (event: RequestEvent) => {
	// Modification de rôle nécessite ROLES permission
	const authCheck = await checkPermission(event, Permission.ROLES);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	const body = await event.request.json();
	const { id, name, hierarchy, permissions } = body;

	await db`
        UPDATE role 
        SET name = ${name}, hierarchy = ${hierarchy}, permissions = ${permissions}
        WHERE id = ${id}
    `;

	return json({ success: true });
};

export const DELETE = async (event: RequestEvent) => {
	// Suppression de rôle nécessite ROLES permission
	const authCheck = await checkPermission(event, Permission.ROLES);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	const body = await event.request.json();
	const { id } = body;

	await db`DELETE FROM role WHERE id = ${id}`;

	return json({ success: true });
};
