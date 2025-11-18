import { json, type RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth-middleware';
import { clearSessionCookie } from '$lib/server/session';

/**
 * Force le rafraîchissement de la session utilisateur
 * Le cookie sera supprimé et recréé au prochain chargement de page
 */
export const POST = async (event: RequestEvent) => {
	const user = await requireAuth(event);
	
	if (!user) {
		return json({ error: 'Non autorisé' }, { status: 401 });
	}
	
	// Supprimer le cookie de session pour forcer un rechargement depuis la DB
	clearSessionCookie(event);
	
	return json({ 
		success: true, 
		message: 'Session rafraîchie. Les nouvelles données seront chargées au prochain chargement de page.' 
	}, { status: 200 });
};
