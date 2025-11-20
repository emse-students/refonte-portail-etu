import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { requirePermission } from "$lib/server/auth-middleware";
import Permission from "$lib/permissions";

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
	return {};
};
