import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { requireAdmin } from "$lib/server/auth-middleware";
import logger from "$lib/server/logger";
import fs from "fs";

export const load: PageServerLoad = async (event) => {
	const user = await requireAdmin(event);

	if (!event.locals.session) {
		throw redirect(303, "/auth/signin");
	}

	if (!user) {
		throw redirect(303, "/");
	}

	let logs: { action: string; user: string; timestamp: string }[] = [];
	try {
		if (fs.existsSync("logs/audit.log")) {
			const logContent = fs.readFileSync("logs/audit.log", "utf-8");
			logs = logContent
				.split("\n")
				.filter((l) => l.trim())
				.map((l) => {
					const parts = l.split(" ; ");
					return { action: parts[0], user: parts[1], timestamp: parts[2] };
				})
				.reverse();
		}
	} catch (e) {
		logger.error("Error reading audit logs", e);
	}

	return { logs };
};
