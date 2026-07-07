/**
 * Render the whole showcase on the client.
 *
 * The data comes from Canari's public API (cross-origin, canari-emse.fr). The
 * deploy host cannot reach that domain server-side, but visitors' browsers can
 * (the API sends permissive CORS headers), so every load runs in the browser.
 * This keeps the app a thin static shell served by the deploy host.
 */
export const ssr = false;
export const prerender = false;
