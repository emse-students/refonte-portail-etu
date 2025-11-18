import { handle as authHandle } from "$lib/server/auth";
import 'dotenv/config';
import { resolve as resolvePath } from "$app/paths";
import type { FullUser } from "$lib/databasetypes";

export const handle = async ({ event, resolve }) => {
	// Gérer l'authentification via Auth.js
	const response = await authHandle({ event, resolve });
	
	// Récupérer la session Auth.js
	// const session = await event.locals.auth();

	const session = {
		user: {
			id: "leon.muselli",
			email: "leon.muselli@etu.emse.fr",
			name: "Léon Muselli",
			image: null
		},
		expires: "2099-12-31T23:59:59.999Z"
	}; // À remplacer par la ligne au-dessus en production
	
	// Si session existe, charger et mettre en cache les données utilisateur complètes
	if (session?.user?.id && !event.locals.userData && !event.request.headers.get('internal')) {
		const userId = session.user.id;
		
		// Charger les données utilisateur depuis la DB avec ses memberships
		const userResponse = await event.fetch(resolvePath(`/api/users/login/${userId}?fullUser=true`), { headers: { internal: 'true' } });
		const data = await userResponse.json();
		const userData: FullUser = data.user;
		
		if (userData) {
			// Mettre les données complètes en cache dans locals (inclut les memberships)
			event.locals.userData = userData;
			event.locals.session = session;
		}
	}
	
	return response;
};