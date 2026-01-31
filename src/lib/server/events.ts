import { escape, getPool } from "$lib/server/database";
import type { FullUser, RawEvent } from "$lib/databasetypes";

export interface FetchEventsOptions {
	start?: Date;
	end?: Date;
	assocId?: number;
	listId?: number;
	requestUnvalidated?: boolean;
	requestAll?: boolean;
	user: FullUser | null; // Replace with proper User type if available
	authorizedAssociationIds?: number[];
	authorizedListIds?: number[];
	canSeeAllUnvalidated?: boolean;
}

export async function fetchEvents(options: FetchEventsOptions): Promise<RawEvent[]> {
	const {
		start,
		end,
		assocId,
		listId,
		requestUnvalidated,
		requestAll,
		user,
		authorizedAssociationIds = [],
		authorizedListIds = [],
		canSeeAllUnvalidated = false,
	} = options;

	const hasStart = start && !isNaN(start.getTime());
	const hasEnd = end && !isNaN(end.getTime());
	const hasAssoc = assocId && assocId > 0;
	const hasList = listId && listId > 0;

	// Construction dynamique des conditions SQL avec escape
	const conditions: string[] = ["1=1"];

	if (hasStart) {
		conditions.push(`e.end_date >= ${escape(start!.toISOString())}`);
	}
	if (hasEnd) {
		conditions.push(`e.start_date <= ${escape(end!.toISOString())}`);
	}
	if (hasAssoc) {
		conditions.push(`e.association_id = ${escape(assocId!)}`);
	}
	if (hasList) {
		conditions.push(`e.list_id = ${escape(listId!)}`);
	}

	if (!requestUnvalidated) {
		conditions.push("e.validated = 1");
	} else {
		if (requestAll && user) {
			// Global admin or proposition page sees everything
		} else {
			if (canSeeAllUnvalidated) {
				// Global admin sees everything
			} else {
				const orConditions = ["e.validated = 1"];

				if (authorizedAssociationIds.length > 0) {
					orConditions.push(`e.association_id IN (${authorizedAssociationIds.join(",")})`);
				}
				if (authorizedListIds.length > 0) {
					orConditions.push(`e.list_id IN (${authorizedListIds.join(",")})`);
				}

				conditions.push(`(${orConditions.join(" OR ")})`);
			}
		}
	}

	const whereClause = conditions.join(" AND ");

	const rows = (
		await getPool()!.query(`
        SELECT 
            e.id, e.title, e.start_date, e.end_date, e.description, e.location, e.association_id, e.list_id, e.validated,
            a.name as association_name, a.handle as association_handle, a.color as association_color, a.icon as association_icon,
            l.name as list_name, l.handle as list_handle, l.color as list_color, l.icon as list_icon
        FROM event e
        LEFT JOIN association a ON e.association_id = a.id
        LEFT JOIN list l ON e.list_id = l.id
        WHERE ${whereClause}
        ORDER BY e.start_date ASC
    `)
	)[0] as RawEvent[];

	return rows;
}
