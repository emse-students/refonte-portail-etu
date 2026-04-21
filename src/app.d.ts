// See https://svelte.dev/docs/kit/types#app.d.ts

import type { FullUser } from "$lib/databasetypes";
import type { AppSession } from "$lib/server/auth";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			userData?: FullUser;
			session?: AppSession;
		}
		interface PageData {
			userData?: FullUser;
			session?: AppSession;
		}
		interface PageState {
			navMenu?: boolean;
			modalOpen?: boolean;
		}
		// interface Platform {}
	}
}

export {};
