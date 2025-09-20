// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import { JwtPayload } from "$lib/jwt";
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: { id: number; username: string } | null;
			token: JwtPayload | null;
		}
		// interface PageData {}
		interface PageState {
			navMenu?: boolean;
			modalOpen?: boolean;
		}
		// interface Platform {}
	}
}

export {};
