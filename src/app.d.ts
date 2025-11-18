// See https://svelte.dev/docs/kit/types#app.d.ts

import type { FullUser, RawUser } from "$lib/databasetypes";
import type { Session } from "@auth/core/types";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: () => Promise<Session | null>;
			userData: FullUser | null;
			session: Session | null;
		}
		interface PageData {
			userData: FullUser | null;
			session: Session | null;
		}
		interface PageState {
			navMenu?: boolean;
			modalOpen?: boolean;
		}
		// interface Platform {}
	}
}

export {};
