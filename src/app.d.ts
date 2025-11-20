// See https://svelte.dev/docs/kit/types#app.d.ts

import type { FullUser } from "$lib/databasetypes";
import type { Session } from "@auth/core/types";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: () => Promise<Session | null>;
			userData?: FullUser;
			session?: Session;
		}
		interface PageData {
			userData?: FullUser;
			session?: Session;
		}
		interface PageState {
			navMenu?: boolean;
			modalOpen?: boolean;
		}
		// interface Platform {}
	}
}

export {};
