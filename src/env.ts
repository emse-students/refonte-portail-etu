import { defineEnvVars } from "@sveltejs/kit/env";

/** Every variable is optional: an unset one means "use the default" at its single read site. */
const optional = (value: string | undefined) => value;

/**
 * Runtime configuration, read at start (dynamic) rather than inlined at build, because the deploy
 * step rewrites `.env` per release and the image never contains a value. See docs/wiki/deployment.md.
 */
export const variables = defineEnvVars({
	/** Canari base URL, used by the browser and the server. */
	PUBLIC_CANARI_URL: { public: true, schema: optional },
});
