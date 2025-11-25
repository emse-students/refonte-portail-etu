import { json, type RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import Permission from "$lib/permissions";
import {
	requireAuth,
	getAuthorizedAssociationIds,
	getAuthorizedListIds,
	checkAssociationPermission,
	checkListPermission,
} from "$lib/server/auth-middleware";

export const GET = async (event: RequestEvent) => {
	// Si l'utilisateur est authentifié et demande ses événements éditables
	const onlyEditable = event.url.searchParams.get("editable") === "true";

	if (onlyEditable) {
		const user = await requireAuth(event);
		if (!user) {
			return json({ error: "Unauthorized" }, { status: 401 });
		}

		const authorizedAssociations = getAuthorizedAssociationIds(user, Permission.EVENTS);
		const authorizedLists = getAuthorizedListIds(user, Permission.EVENTS);

		// Si null, l'utilisateur est admin et peut tout voir
		if (authorizedAssociations === null || authorizedLists === null) {
			const events = await db`
                SELECT
                    e.id, e.association_id, e.list_id, e.title, e.description, e.start_date, 
                    e.end_date, e.location, e.validated,
                    a.name as association_name,
					l.name as list_name
                FROM
                    event e
                LEFT JOIN association a ON e.association_id = a.id
				LEFT JOIN list l ON e.list_id = l.id
                ORDER BY e.start_date DESC
            `;
			return json(events);
		}

		// Sinon, filtrer par les associations et listes autorisées
		if (authorizedAssociations.length === 0 && authorizedLists.length === 0) {
			return json([]);
		}

		const events = await db`
            SELECT
                e.id, e.association_id, e.list_id, e.title, e.description, e.start_date, 
                e.end_date, e.location, e.validated,
                a.name as association_name,
				l.name as list_name
            FROM
                event e
            LEFT JOIN association a ON e.association_id = a.id
			LEFT JOIN list l ON e.list_id = l.id
            WHERE 
				(e.association_id = ANY(${authorizedAssociations}) AND e.association_id IS NOT NULL)
				OR 
				(e.list_id = ANY(${authorizedLists}) AND e.list_id IS NOT NULL)
            ORDER BY e.start_date DESC
        `;
		return json(events);
	}

	// Liste des événements accessible publiquement
	const events = await db`
        SELECT
            e.id, e.association_id, e.list_id, e.title, e.description, e.start_date, 
            e.end_date, e.location,
            a.name as association_name,
			l.name as list_name
        FROM
            event e
        LEFT JOIN association a ON e.association_id = a.id
		LEFT JOIN list l ON e.list_id = l.id
		WHERE e.validated = true
        ORDER BY e.start_date DESC
    `;

	return json(events);
};

export const POST = async (event: RequestEvent) => {
	const body = await event.request.json();
	const { association_id, list_id, title, description, start_date, end_date, location, validated } =
		body;

	if (!association_id && !list_id) {
		return json({ error: "association_id or list_id is required" }, { status: 400 });
	}

	const user = await requireAuth(event);
	if (!user) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	// Vérifier les permissions
	if (association_id) {
		const authCheck = await checkAssociationPermission(event, association_id, Permission.EVENTS);
		if (!authCheck.authorized) return authCheck.response;
	} else if (list_id) {
		const authCheck = await checkListPermission(event, list_id, Permission.EVENTS);
		if (!authCheck.authorized) return authCheck.response;
	}

	// Check if event submission is open
	// Global managers bypass this check
	const authorizedAssociations = getAuthorizedAssociationIds(user, Permission.EVENTS);
	const isGlobalManager = authorizedAssociations === null; // null means global access

	if (!isGlobalManager) {
		const configRows = await db`SELECT value FROM config WHERE key_name = 'event_submission_open'`;
		const isOpen = configRows.length > 0 && configRows[0].value === "true";

		if (!isOpen) {
			return json(
				{ error: "Forbidden", message: "La soumission d'événements est actuellement fermée." },
				{ status: 403 }
			);
		}
	}

	// Determine validation status
	const isValidated = isGlobalManager ? (validated ?? true) : false;

	await db`
        INSERT INTO event (association_id, list_id, title, description, start_date, end_date, location, validated)
        VALUES (${association_id || null}, ${list_id || null}, ${title}, ${description}, ${new Date(start_date)}, ${new Date(end_date)}, ${location}, ${isValidated})
    `;

	return new Response(JSON.stringify({ success: true }), {
		status: 201,
		headers: { "Content-Type": "application/json" },
	});
};

export const PUT = async (event: RequestEvent) => {
	const body = await event.request.json();
	const {
		id,
		association_id,
		list_id,
		title,
		description,
		start_date,
		end_date,
		location,
		validated,
	} = body;

	if (!id || (!association_id && !list_id)) {
		return json({ error: "id and (association_id or list_id) are required" }, { status: 400 });
	}

	const user = await requireAuth(event);
	if (!user) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	// Récupérer l'événement existant
	const existingEvent = await db`
        SELECT association_id, list_id, validated FROM event WHERE id = ${id}
    `.then((rows) => rows?.[0]);

	if (!existingEvent) {
		return json({ error: "Event not found" }, { status: 404 });
	}

	// Vérifier la permission pour l'entité actuelle de l'événement
	if (existingEvent.association_id) {
		const authCheck = await checkAssociationPermission(
			event,
			existingEvent.association_id,
			Permission.EVENTS
		);
		if (!authCheck.authorized) return authCheck.response;
	} else if (existingEvent.list_id) {
		const authCheck = await checkListPermission(event, existingEvent.list_id, Permission.EVENTS);
		if (!authCheck.authorized) return authCheck.response;
	}

	// Si on change d'entité, vérifier aussi la permission pour la nouvelle
	if (association_id && existingEvent.association_id !== association_id) {
		const newAuthCheck = await checkAssociationPermission(event, association_id, Permission.EVENTS);
		if (!newAuthCheck.authorized)
			return json(
				{ error: "Forbidden", message: "Pas de permission pour la nouvelle association" },
				{ status: 403 }
			);
	}
	if (list_id && existingEvent.list_id !== list_id) {
		const newAuthCheck = await checkListPermission(event, list_id, Permission.EVENTS);
		if (!newAuthCheck.authorized)
			return json(
				{ error: "Forbidden", message: "Pas de permission pour la nouvelle liste" },
				{ status: 403 }
			);
	}

	// Determine validation status update
	const authorizedAssociations = getAuthorizedAssociationIds(user, Permission.EVENTS);
	const isGlobalManager = authorizedAssociations === null;

	let newValidatedStatus = false;
	if (isGlobalManager) {
		newValidatedStatus = validated !== undefined ? validated : existingEvent.validated;
	} else {
		newValidatedStatus = false;
	}

	await db`
        UPDATE event 
        SET association_id = ${association_id || null}, list_id = ${list_id || null},
            title = ${title}, description = ${description},
            start_date = ${start_date}, end_date = ${end_date}, location = ${location},
            validated = ${newValidatedStatus}
        WHERE id = ${id}
    `;

	return json({ success: true });
};

export const DELETE = async (event: RequestEvent) => {
	const body = await event.request.json();
	const { id } = body;

	if (!id) {
		return json({ error: "id is required" }, { status: 400 });
	}

	const existingEvent = await db`
        SELECT association_id, list_id FROM event WHERE id = ${id}
    `.then((rows) => rows?.[0]);

	if (!existingEvent) {
		return json({ error: "Event not found" }, { status: 404 });
	}

	if (existingEvent.association_id) {
		const authCheck = await checkAssociationPermission(
			event,
			existingEvent.association_id,
			Permission.EVENTS
		);
		if (!authCheck.authorized) return authCheck.response;
	} else if (existingEvent.list_id) {
		const authCheck = await checkListPermission(event, existingEvent.list_id, Permission.EVENTS);
		if (!authCheck.authorized) return authCheck.response;
	}

	await db`DELETE FROM event WHERE id = ${id}`;

	return json({ success: true });
};
