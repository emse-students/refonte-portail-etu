import type { Handle } from "@sveltejs/kit";
import { paraglideMiddleware } from "$lib/paraglide/server";

/**
 * Resolves the request's locale BEFORE the page renders, and stamps it into `<html lang>`.
 *
 * This exists because `ssr` was turned back on (`src/routes/+layout.ts`). Under SPA mode the locale
 * was a purely client-side question and any strategy worked. Under SSR it is answered TWICE - once
 * by the server building the HTML, once by the browser hydrating it - and **the two answers must
 * agree by construction**, because Svelte's hydration claims the server's text nodes rather than
 * comparing them: a server that renders French for a reader the client resolves as English leaves
 * that reader on French text until they navigate, with nothing logged anywhere.
 *
 * So the strategy list is `["cookie", "baseLocale"]` and nothing else (`vite.config.ts`). Those are
 * the only two Paraglide can evaluate on both sides: `localStorage` and `preferredLanguage` are
 * skipped whenever `isServer`, so including either would make the server fall through to the base
 * locale while the client answered something else - exactly the mismatch above. Automatic
 * `Accept-Language` detection is the price, paid deliberately: the base locale is French, the site
 * serves a French school, and `LocaleToggle` writes the cookie and reloads, so a reader's choice
 * survives.
 *
 * The response therefore varies on the `PARAGLIDE_LOCALE` cookie. Nothing caches it today - the
 * portal is served straight from Bun on its own host, with no CDN in front - but any shared cache
 * added later owes a `Vary: Cookie`.
 */
export const handle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace("%paraglide.lang%", locale),
		});
	});
