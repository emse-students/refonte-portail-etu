import { handle as authHandle } from "$lib/server/auth";

export const handle = async ({ event, resolve }) => {
	return authHandle({ event, resolve });
};
