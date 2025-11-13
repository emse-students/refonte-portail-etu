import { handle as authHandle } from "$lib/server/auth";
import 'dotenv/config';

export const handle = async ({ event, resolve }) => {
	return authHandle({ event, resolve });
};
