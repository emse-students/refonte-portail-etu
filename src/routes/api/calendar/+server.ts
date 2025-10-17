import type { RequestEvent } from "@sveltejs/kit";

// GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD

import db from "$lib/server/database";
import { json } from "@sveltejs/kit";

export async function GET() {
	

	return json(events);
}
