import { json, type RequestEvent } from "@sveltejs/kit";
import db from "$lib/server/database";
import Permission from "$lib/permissions";
import {
	requireAuth,
	getAuthorizedAssociationIds,
	checkAssociationPermission,
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

		// Si null, l'utilisateur est admin et peut tout voir
		if (authorizedAssociations === null) {
			const events = await db`
                SELECT
                    e.id, e.association_id, e.title, e.description, e.start_date, 
                    e.end_date, e.location,
                    a.name as association_name
                FROM
                    event e
                LEFT JOIN association a ON e.association_id = a.id
                ORDER BY e.start_date DESC
            `;
			return json(events);
		}

		// Sinon, filtrer par les associations autorisées
		if (authorizedAssociations.length === 0) {
			return json([]);
		}

		const events = await db`
            SELECT
                e.id, e.association_id, e.title, e.description, e.start_date, 
                e.end_date, e.location,
                a.name as association_name
            FROM
                event e
            LEFT JOIN association a ON e.association_id = a.id
            WHERE e.association_id = ANY(${authorizedAssociations})
            ORDER BY e.start_date DESC
        `;
		return json(events);
	}

	// Liste des événements accessible publiquement
	const events = await db`
        SELECT
            e.id, e.association_id, e.title, e.description, e.start_date, 
            e.end_date, e.location,
            a.name as association_name
        FROM
            event e
        LEFT JOIN association a ON e.association_id = a.id
        ORDER BY e.start_date DESC
    `;

	return json(events);
};

export const POST = async (event: RequestEvent) => {
	const body = await event.request.json();
	const { association_id, title, description, start_date, end_date, location } = body;

	if (!association_id) {
		return json({ error: "association_id is required" }, { status: 400 });
	}

	// Vérifier que l'utilisateur a la permission EVENTS pour cette association spécifique
	const authCheck = await checkAssociationPermission(event, association_id, Permission.EVENTS);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	await db`
        INSERT INTO event (association_id, title, description, start_date, end_date, location)
        VALUES (${association_id}, ${title}, ${description}, ${start_date}, ${end_date}, ${location})
    `;

	return new Response(JSON.stringify({ success: true }), {
		status: 201,
		headers: { "Content-Type": "application/json" },
	});
};

export const PUT = async (event: RequestEvent) => {
	const body = await event.request.json();
	const { id, association_id, title, description, start_date, end_date, location } = body;

	if (!id || !association_id) {
		return json({ error: "id and association_id are required" }, { status: 400 });
	}

	// Récupérer l'événement existant pour vérifier son association
	const existingEvent = await db`
        SELECT association_id FROM event WHERE id = ${id}
    `.then((rows) => rows?.[0]);

	if (!existingEvent) {
		return json({ error: "Event not found" }, { status: 404 });
	}

	// Vérifier la permission pour l'association actuelle de l'événement
	const authCheck = await checkAssociationPermission(
		event,
		existingEvent.association_id,
		Permission.EVENTS
	);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	// Si on change l'association, vérifier aussi la permission pour la nouvelle association
	if (existingEvent.association_id !== association_id) {
		const newAssocAuthCheck = await checkAssociationPermission(
			event,
			association_id,
			Permission.EVENTS
		);
		if (!newAssocAuthCheck.authorized) {
			return json(
				{
					error: "Forbidden",
					message: "Vous n'avez pas la permission de déplacer cet événement vers cette association",
				},
				{ status: 403 }
			);
		}
	}

	await db`
        UPDATE event 
        SET association_id = ${association_id}, title = ${title}, description = ${description},
            start_date = ${start_date}, end_date = ${end_date}, location = ${location}
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

	// Récupérer l'événement pour vérifier son association
	const existingEvent = await db`
        SELECT association_id FROM event WHERE id = ${id}
    `.then((rows) => rows?.[0]);

	if (!existingEvent) {
		return json({ error: "Event not found" }, { status: 404 });
	}

	// Vérifier la permission pour l'association de l'événement
	const authCheck = await checkAssociationPermission(
		event,
		existingEvent.association_id,
		Permission.EVENTS
	);
	if (!authCheck.authorized) {
		return authCheck.response;
	}

	await db`DELETE FROM event WHERE id = ${id}`;

	return json({ success: true });
};
