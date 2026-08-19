/**
 * Render on the SERVER, then hydrate.
 *
 * This was `ssr = false`, justified by hairpin NAT - "the portal and Canari sit behind the same
 * public IP", so a server-side fetch to the public API could not complete. **That reason no longer
 * describes the network, and the probe that settled it is in the repository**
 * (`.github/workflows/probe-egress.yml`, run 2026-08-19 on the deploy host itself):
 * `canari-emse.fr` resolves to Cloudflare anycast while `portail-etu.emse.fr` is 193.49.175.67, so
 * the request leaves for Cloudflare rather than hairpinning through the portal's own NAT, and it
 * came back `status=200 bytes=30732` in 122 ms.
 *
 * The cost of leaving it off was the whole point of this site. It is the PUBLIC face of the
 * ecosystem - no login, no editing - and with `ssr = false` `<svelte:head>` never ran on the
 * server, so every page shipped a head with no title, no description and no preview image. Measured
 * on prod the same day: `/associations/bde` returned a `<head>` carrying charset, icon, viewport
 * and a stylesheet link, and nothing else. That is what a search engine indexed, and what every
 * Discord, Slack and WhatsApp unfurl had to work from.
 *
 * Loaders stay UNIVERSAL (`+page.ts`, not `+page.server.ts`): the server renders the first view and
 * SvelteKit serialises the result into the page, so hydration re-fetches nothing, while a later
 * client-side navigation still reaches Canari straight from the visitor's browser. The added cost
 * is one API call per cold page view. Every remote call carries `OUTBOUND_BUDGET_MS`, which is what
 * stops a silent upstream from holding a response open rather than a loading spinner.
 */
export const ssr = true;
export const prerender = false;
