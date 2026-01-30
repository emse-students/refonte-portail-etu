import db, { escape, getPool } from "$lib/server/database";
import type { RequestEvent } from "./$types";
import type { RowDataPacket } from "mysql2/promise";

function toICSDate(d: Date) {
	// Ensure UTC and format YYYYMMDDTHHMMSSZ
	const yy = d.getUTCFullYear();
	const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
	const dd = String(d.getUTCDate()).padStart(2, "0");
	const hh = String(d.getUTCHours()).padStart(2, "0");
	const mi = String(d.getUTCMinutes()).padStart(2, "0");
	const ss = String(d.getUTCSeconds()).padStart(2, "0");
	return `${yy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function escapeICS(text: string | null | undefined) {
	if (!text) return "";
	return String(text)
		.replace(/\r\n|\r|\n/g, "\\n")
		.replace(/([,;])/g, "\\$1");
}

export async function GET({ url }: RequestEvent) {
	const assoId = url.searchParams.get("asso") ? Number(url.searchParams.get("asso")) : null;

	let queryString =
		"SELECT e.id, e.title, e.start_date, e.end_date, e.description, e.location, e.association_id, a.name as association_name \
    FROM event e \
    LEFT JOIN association a ON e.association_id = a.id \
    WHERE e.end_date >= CURRENT_TIMESTAMP AND e.validated = true";

	if (assoId) {
		queryString += ` AND e.association_id = ${escape(assoId)} `;
	}

	queryString += " ORDER BY e.start_date ASC";

	const rows = await getPool()
		.query<
			({
				id: number;
				title: string | null;
				start_date: string;
				end_date: string;
				description: string | null;
				location: string | null;
				association_id: number | null;
				association_name: string | null;
			} & RowDataPacket)[]
		>(queryString)
		.then((res) => res[0]);

	const icsLines: string[] = [];
	icsLines.push("BEGIN:VCALENDAR");
	icsLines.push("PRODID:-//EMSE Portail Etudiants//FR");
	icsLines.push("VERSION:2.0");
	icsLines.push("CALSCALE:GREGORIAN");
	icsLines.push("METHOD:PUBLISH");

	for (const r of rows) {
		const id = r.id;
		const title = escapeICS(r.title || "(no title)");
		const desc = escapeICS(
			r.description || (r.association_name ? `Association: ${r.association_name}` : "")
		);
		const loc = escapeICS(r.location || "");

		const start = new Date(r.start_date);
		const end = new Date(r.end_date);

		const dtstart = toICSDate(start);
		const dtend = toICSDate(end);

		const uid = `event-${id}@portail-etu.emse.fr`;
		const dtstamp = toICSDate(new Date());

		icsLines.push("BEGIN:VEVENT");
		icsLines.push(`UID:${uid}`);
		icsLines.push(`DTSTAMP:${dtstamp}`);
		icsLines.push(`DTSTART:${dtstart}`);
		icsLines.push(`DTEND:${dtend}`);
		icsLines.push(`SUMMARY:${title}`);
		if (desc) icsLines.push(`DESCRIPTION:${desc}`);
		if (loc) icsLines.push(`LOCATION:${loc}`);
		icsLines.push("END:VEVENT");
	}

	icsLines.push("END:VCALENDAR");

	const ics = icsLines.join("\r\n");

	return new Response(ics, {
		status: 200,
		headers: {
			"Content-Type": "text/calendar; charset=utf-8",
			"Content-Disposition": `attachment; filename="calendar.ics"`,
		},
	});
}
