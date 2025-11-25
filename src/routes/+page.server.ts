import type { PageServerLoad } from "./$types";
import db, { getPool } from "$lib/server/database";
import type { ConfigRow } from "$lib/databasetypes";

export const load: PageServerLoad = async () => {
	let eventSubmissionOpen = false;
	try {
		// Ensure table exists (just in case)
		await getPool().query(`
            CREATE TABLE IF NOT EXISTS config (
                key_name VARCHAR(255) PRIMARY KEY,
                value VARCHAR(255)
            )
        `);

		const rows =
			await db<ConfigRow>`SELECT value FROM config WHERE key_name = 'event_submission_open'`;
		if (rows.length > 0) {
			eventSubmissionOpen = rows[0].value === "true";
		}
	} catch (e) {
		console.error("Error fetching config:", e);
	}

	return {
		eventSubmissionOpen,
	};
};
