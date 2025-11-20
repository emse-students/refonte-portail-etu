import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
	// Les données sont déjà chargées et mises en cache dans locals par hooks.server.ts
	return {
		session: locals.session,
		userData: locals.userData,
	};
};
