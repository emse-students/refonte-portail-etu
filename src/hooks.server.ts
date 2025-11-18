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
	
	// Toujours définir la session dans locals
	if (session) {
		event.locals.session = session;
	}
	
	// Si session existe, charger et mettre en cache les données utilisateur complètes
	// Éviter la boucle : ne charger que si userData n'existe pas déjà
	// Et ne pas charger depuis l'endpoint qui charge les données lui-même
	if (session?.user?.id && !event.locals.userData && !event.url.pathname.includes('/api/users/login/')) {
		const userId = session.user.id;
		
		try {
			// Charger les données utilisateur depuis la DB avec ses memberships
			const userResponse = await event.fetch(resolvePath(`/api/users/login/${userId}?fullUser=true`));
			
			if (userResponse.ok) {
				const data = await userResponse.json();
				const userData: FullUser = data.user;
				
				if (userData) {
					// Mettre les données complètes en cache dans locals (inclut les memberships)
					event.locals.userData = userData;
				}
			}
		} catch (error) {
			console.error('Erreur lors du chargement de userData:', error);
		}
	}
	
	return response;
};