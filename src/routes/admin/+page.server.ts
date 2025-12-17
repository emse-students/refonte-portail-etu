import { redirect, fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { requirePermission } from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";
import db from "$lib/server/database";
import logger, { logAudit } from "$lib/server/logger";
import fs from "fs";

export const load: PageServerLoad = async (event) => {
	// Récupérer la session de l'utilisateur depuis les `locals`
	const user = await requirePermission(event, Permission.ADMIN);

	// Si l'utilisateur n'est pas connecté, le rediriger vers la page de connexion
	if (!event.locals.session) {
		throw redirect(303, "/auth/signin");
	}

	// Vérifier si l'utilisateur a le rôle 'ADMIN'
	// Adaptez la condition à la structure de votre objet utilisateur et à vos rôles
	if (!user) {
		// Si l'utilisateur n'a pas les permissions, le rediriger vers la page d'accueil
		// ou une page d'erreur "non autorisé".
		throw redirect(303, "/");
	}

	// Si l'utilisateur est un administrateur, la page peut être chargée.
	// Vous pouvez retourner des données ici si nécessaire.
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

export const actions: Actions = {
	updateUser: async ({ request, locals }) => {
		if (!locals.session) return fail(401);
		const data = await request.formData();
		const id = data.get("id");
		const first_name = data.get("first_name");
		const last_name = data.get("last_name");
		const email = data.get("email");
		const login = data.get("login");
		const promo = data.get("promo");

		if (!id) return fail(400, { error: "Missing ID" });

		try {
			await db`UPDATE user SET 
				first_name = ${first_name}, 
				last_name = ${last_name}, 
				email = ${email}, 
				login = ${login}, 
				promo = ${promo},
				edited_at = NOW()
				WHERE id = ${id}`;

			logAudit(`Update User ${id}`, locals.userData?.login || String(locals.session?.user?.id));
			return { success: true };
		} catch (err) {
			logger.error("Error updating user", err);
			return fail(500, { error: "Database error" });
		}
	},
	deleteUser: async ({ request, locals }) => {
		if (!locals.session) return fail(401);
		const data = await request.formData();
		const id = data.get("id");
		if (!id) return fail(400, { error: "Missing ID" });

		try {
			await db`DELETE FROM user WHERE id = ${id}`;
			logAudit(`Delete User ${id}`, locals?.userData?.login || String(locals.session?.user?.id));
			return { success: true };
		} catch (err) {
			logger.error("Error deleting user", err);
			return fail(500, { error: "Database error" });
		}
	},
	updateAssociation: async ({ request, locals }) => {
		if (!locals.session) return fail(401);
		const data = await request.formData();
		const id = data.get("id");
		const name = data.get("name");
		const handle = data.get("handle");
		const description = data.get("description");
		const color = data.get("color");

		if (!id) return fail(400, { error: "Missing ID" });

		try {
			await db`UPDATE association SET 
				name = ${name}, 
				handle = ${handle}, 
				description = ${description}, 
				color = ${color},
				edited_at = NOW()
				WHERE id = ${id}`;

			logAudit(
				`Update Association ${id}`,
				locals.userData?.login || String(locals.session?.user?.id)
			);
			return { success: true };
		} catch (err) {
			logger.error("Error updating association", err);
			return fail(500, { error: "Database error" });
		}
	},
	deleteAssociation: async ({ request, locals }) => {
		if (!locals.session) return fail(401);
		const data = await request.formData();
		const id = data.get("id");
		if (!id) return fail(400, { error: "Missing ID" });

		try {
			await db`DELETE FROM association WHERE id = ${id}`;
			logAudit(
				`Delete Association ${id}`,
				locals.userData?.login || String(locals.session?.user?.id)
			);
			return { success: true };
		} catch (err) {
			logger.error("Error deleting association", err);
			return fail(500, { error: "Database error" });
		}
	},
	updateEvent: async ({ request, locals }) => {
		if (!locals.session) return fail(401);
		const data = await request.formData();
		const id = data.get("id");
		const title = data.get("title");
		const description = data.get("description");
		const location = data.get("location");
		const start_date = data.get("start_date")?.toString().replace("T", " ");
		const end_date = data.get("end_date")?.toString().replace("T", " ");
		const validated = data.get("validated") === "true";

		if (!id) return fail(400, { error: "Missing ID" });

		try {
			await db`UPDATE event SET 
				title = ${title}, 
				description = ${description}, 
				location = ${location}, 
				start_date = ${start_date},
				end_date = ${end_date},
				validated = ${validated},
				edited_at = NOW()
				WHERE id = ${id}`;

			logAudit(`Update Event ${id}`, locals.userData?.login || String(locals.session?.user?.id));
			return { success: true };
		} catch (err) {
			logger.error("Error updating event", err);
			return fail(500, { error: "Database error" });
		}
	},
	deleteEvent: async ({ request, locals }) => {
		if (!locals.session) return fail(401);
		const data = await request.formData();
		const id = data.get("id");
		if (!id) return fail(400, { error: "Missing ID" });

		try {
			await db`DELETE FROM event WHERE id = ${id}`;
			logAudit(`Delete Event ${id}`, locals.userData?.login || String(locals.session?.user?.id));
			return { success: true };
		} catch (err) {
			logger.error("Error deleting event", err);
			return fail(500, { error: "Database error" });
		}
	},
	updateList: async ({ request, locals }) => {
		if (!locals.session) return fail(401);
		const data = await request.formData();
		const id = data.get("id");
		const name = data.get("name");
		const handle = data.get("handle");
		const description = data.get("description");
		const promo = data.get("promo");
		const color = data.get("color");

		if (!id) return fail(400, { error: "Missing ID" });

		try {
			await db`UPDATE list SET 
				name = ${name}, 
				handle = ${handle}, 
				description = ${description}, 
				promo = ${promo},
				color = ${color},
				edited_at = NOW()
				WHERE id = ${id}`;

			logAudit(`Update List ${id}`, locals.userData?.login || String(locals.session?.user?.id));
			return { success: true };
		} catch (err) {
			logger.error("Error updating list", err);
			return fail(500, { error: "Database error" });
		}
	},
	deleteList: async ({ request, locals }) => {
		if (!locals.session) return fail(401);
		const data = await request.formData();
		const id = data.get("id");
		if (!id) return fail(400, { error: "Missing ID" });

		try {
			await db`DELETE FROM list WHERE id = ${id}`;
			logAudit(`Delete List ${id}`, locals.userData?.login || String(locals.session?.user?.id));
			return { success: true };
		} catch (err) {
			logger.error("Error deleting list", err);
			return fail(500, { error: "Database error" });
		}
	},
	updateRole: async ({ request, locals }) => {
		if (!locals.session) return fail(401);
		const data = await request.formData();
		const id = data.get("id");
		const name = data.get("name");
		const hierarchy = data.get("hierarchy");
		const permissions = data.get("permissions");

		if (!id) return fail(400, { error: "Missing ID" });

		try {
			await db`UPDATE role SET 
				name = ${name}, 
				hierarchy = ${hierarchy}, 
				permissions = ${permissions},
				edited_at = NOW()
				WHERE id = ${id}`;

			logAudit(`Update Role ${id}`, locals.userData?.login || String(locals.session?.user?.id));
			return { success: true };
		} catch (err) {
			logger.error("Error updating role", err);
			return fail(500, { error: "Database error" });
		}
	},
	deleteRole: async ({ request, locals }) => {
		if (!locals.session) return fail(401);
		const data = await request.formData();
		const id = data.get("id");
		if (!id) return fail(400, { error: "Missing ID" });

		try {
			await db`DELETE FROM role WHERE id = ${id}`;
			logAudit(`Delete Role ${id}`, locals.userData?.login || String(locals.session?.user?.id));
			return { success: true };
		} catch (err) {
			logger.error("Error deleting role", err);
			return fail(500, { error: "Database error" });
		}
	},
};
