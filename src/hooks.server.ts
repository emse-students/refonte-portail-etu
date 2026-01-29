import { handle as authHandle } from "$lib/server/auth";
import { sequence } from "@sveltejs/kit/hooks";
import type { Handle } from "@sveltejs/kit";
import type { Member, RawUser } from "$lib/databasetypes";
import db from "$lib/server/database";
import { getSessionData, setSessionCookie, clearSessionCookie } from "$lib/server/session";
import logger from "$lib/server/logger";
import Permission from "$lib/permissions";

const logHandle: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	logger.info(`Incoming request: ${event.request.method} ${event.url.pathname}`);
	const response = await resolve(event);
	const duration = Date.now() - start;
	logger.info(
		`Response status: ${response.status} for ${event.request.method} ${event.url.pathname} (${duration}ms)`
	);
	return response;
};

// Notre propre handler pour gérer les données utilisateur
const userDataHandle: Handle = async ({ event, resolve }) => {
	// À ce stade, authHandle a déjà été exécuté et event.locals.auth() est disponible
	const session = await event.locals.auth();

	// Toujours définir la session dans locals
	if (session) {
		event.locals.session = session;
	}

	// Essayer d'abord de récupérer les données depuis le cookie de session
	let userData = getSessionData(event);

	// Si pas de session Auth.js mais qu'il y a un cookie user_session, l'invalider
	if ((!session?.user?.id && userData) || session?.user?.id !== userData?.login) {
		logger.info(
			"Session Auth.js invalide mais cookie user_session présent → suppression du cookie"
		);
		clearSessionCookie(event);
		userData = null;
	}

	// Si pas de données en session ou si la session Auth.js ne correspond pas
	if (session?.user?.id && !userData) {
		try {
			// Charger les données utilisateur directement depuis la DB
			const user =
				(await db<RawUser>`SELECT * FROM user WHERE login = ${session.user.id}`.then(
					(rows) => rows?.[0]
				)) || null;

			if (user) {
				// Récupérer les memberships avec un JOIN
				const membershipsData = (await db`
					SELECT 
						id as member_id, 
						visible, 
						association_id,
						role_name, 
						permissions as role_permissions, 
						hierarchy
					FROM member
					WHERE user_id = ${user.id}
				`) as {
					member_id: number;
					visible: boolean;
					association_id: number;
					role_name: string;
					role_permissions: number;
					hierarchy: number;
				}[];

				const memberships: Member[] = membershipsData.map((m) => ({
					id: m.member_id,
					visible: m.visible,
					association_id: m.association_id,
					list_id: null,
					user,
					role_name: m.role_name,
					permissions: m.role_permissions,
					hierarchy: m.hierarchy,
				}));

				// Calculer les permissions globales
				let globalPermissions = 0;
				if (memberships.length > 0) {
					const maxPermissions = Math.max(...memberships.map((m) => m.permissions));
					if (maxPermissions >= Permission.ADMIN) {
						globalPermissions = Permission.ADMIN;
					}
				}

				if (user.admin) {
					globalPermissions = Permission.ADMIN;
				}

				userData = { ...user, memberships, permissions: globalPermissions };

				// Stocker dans un cookie de session sécurisé
				setSessionCookie(event, userData);
			}
		} catch (error) {
			logger.error("Erreur lors du chargement de userData:", { error });
		}
	}

	// Mettre les données complètes en cache dans locals
	if (userData) {
		event.locals.userData = userData;
	}

	// Continuer avec la résolution de la requête
	return resolve(event);
};

// Clear old cookies handle
const clearOldCookiesHandle: Handle = async ({ event, resolve }) => {
	// Ici, on pourrait vérifier et nettoyer les anciens cookies si nécessaire
	if (event.cookies.get("PHPSESSID")) {
		event.cookies.delete("PHPSESSID", { path: "/" });
	}
	return resolve(event);
};

// Enchaîner les handlers : d'abord authHandle (qui configure event.locals.auth), puis userDataHandle
export const handle = sequence(logHandle, clearOldCookiesHandle, authHandle, userDataHandle);
