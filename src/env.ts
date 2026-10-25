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
	/** MiGallery base URL for the avatar proxy. */
	GALLERY_API_URL: { schema: optional },
	/** MiGallery API key. Never sent to the browser. */
	GALLERY_API_KEY: { schema: optional },
	/** `Origin` header sent to MiGallery, if needed. */
	PORTAL_URL: { schema: optional },
});
