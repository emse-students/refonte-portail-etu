import type { RequestHandler } from "./$types";
import { CSP_REPORT_MAX_BYTES, noteCspReport } from "#lib/server/security-headers";

/**
 * Where browsers post what the report-only content security policy would have blocked
 * (`csp.config.ts`, `reportOnly`). Public: the site has no session at all. Nothing is stored; a
 * distinct violation is one log line (`noteCspReport`). Always 204 - a browser does nothing with
 * the answer.
 */
export const POST: RequestHandler = async ({ request }) => {
	const declared = Number(request.headers.get("content-length") ?? "0");
	if (Number.isFinite(declared) && declared > CSP_REPORT_MAX_BYTES) {
		console.warn(`[CSP] a report of ${declared} bytes was dropped unread`);
		return new Response(null, { status: 204 });
	}
	const raw = await request.text();
	if (raw.length > CSP_REPORT_MAX_BYTES) {
		console.warn(`[CSP] a report of ${raw.length} characters was dropped`);
		return new Response(null, { status: 204 });
	}
	noteCspReport(raw);
	return new Response(null, { status: 204 });
};
