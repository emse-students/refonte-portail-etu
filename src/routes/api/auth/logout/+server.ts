import { clearSessionCookie } from "$lib/server/session";
import { json, type RequestEvent } from "@sveltejs/kit";

export const POST = async (event: RequestEvent) => {
	// Supprimer le cookie de session
	clearSessionCookie(event);

	return json({ success: true, message: "Déconnecté avec succès" }, { status: 200 });
};
