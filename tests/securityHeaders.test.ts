import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "@sveltejs/kit";
import {
	applySecurityHeaders,
	CSP_REPORT_MAX_BYTES,
	forgetCspReports,
	noteCspReport,
	SECURITY_HEADERS,
} from "#lib/server/security-headers";
import { appHtmlScriptHashes, CANARI_ORIGIN, CSP, CSP_REPORT_PATH } from "../csp.config";

vi.mock("#lib/paraglide/server", () => ({
	paraglideMiddleware: (
		req: Request,
		cb: (a: { request: Request; locale: string }) => Promise<Response>
	) => cb({ request: req, locale: "fr" }),
}));

const { handle } = await import("../src/hooks.server");
const { POST } = await import("../src/routes/api/csp-report/+server");

/**
 * The headers every answer carries, and the content security policy in its observing release:
 * nothing is blocked yet, and what WOULD be is logged where it can be read.
 */

describe("the headers of every answer", () => {
	it("are nosniff, an origin-only referrer across sites, and no framing by another site", () => {
		expect(SECURITY_HEADERS).toEqual({
			"X-Content-Type-Options": "nosniff",
			"Referrer-Policy": "strict-origin-when-cross-origin",
			"X-Frame-Options": "SAMEORIGIN",
		});
	});

	it("are written on a response that has none", () => {
		const headers = new Headers();
		applySecurityHeaders(headers);

		for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
			expect(headers.get(name)).toBe(value);
		}
	});

	it("leave a stricter value a route already set", () => {
		const headers = new Headers({ "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY" });
		applySecurityHeaders(headers);

		expect(headers.get("Referrer-Policy")).toBe("no-referrer");
		expect(headers.get("X-Frame-Options")).toBe("DENY");
		expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
	});
});

describe("the outermost handler", () => {
	const run = (resolve: () => Promise<Response>, path = "/liens") =>
		handle({
			event: {
				request: new Request(`https://x.test${path}`),
				url: new URL(`https://x.test${path}`),
			},
			resolve,
		} as unknown as Parameters<typeof handle>[0]);

	it("writes the headers on a page", async () => {
		const res = await run(() => Promise.resolve(new Response("ok")));

		for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
			expect(res.headers.get(name)).toBe(value);
		}
	});

	it("writes them on a redirect thrown past resolve, and keeps its target", async () => {
		const res = await run(() => {
			throw redirect(302, "/associations");
		});

		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe("/associations");
		expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
	});

	it("lets any other failure through untouched", async () => {
		await expect(
			run(() => {
				throw new Error("boom");
			})
		).rejects.toThrow("boom");
	});
});

describe("a violation report", () => {
	let warn: ReturnType<typeof vi.spyOn>;
	beforeEach(() => {
		forgetCspReports();
		warn = vi.spyOn(console, "warn").mockImplementation(() => {});
	});
	afterEach(() => void warn.mockRestore());

	const report = (blocked = "https://cdn.example/a.js?v=3") =>
		JSON.stringify({
			"csp-report": {
				"effective-directive": "script-src-elem",
				"blocked-uri": blocked,
				"document-uri": "https://portail.example/associations?q=someone#top",
				"source-file": "https://portail.example/_app/immutable/a.js",
			},
		});

	it("is logged once, with no query and no fragment in it", () => {
		const line = noteCspReport(report());

		expect(line).toBe(
			"[CSP] would block: directive=script-src-elem blocked=https://cdn.example/a.js page=https://portail.example/associations source=https://portail.example/_app/immutable/a.js (occurrence #1)"
		);
		expect(warn).toHaveBeenCalledTimes(1);
	});

	it("is then said at its 10th and 100th occurrence, with the count", () => {
		const said = Array.from({ length: 100 }, () => noteCspReport(report())).filter(Boolean);

		expect(said).toHaveLength(3);
		expect(said[1]).toContain("(occurrence #10)");
		expect(said[2]).toContain("(occurrence #100)");
	});

	it("counts another blocked resource apart", () => {
		noteCspReport(report());

		expect(noteCspReport(report("https://other.example/b.js"))).toContain("(occurrence #1)");
	});

	it("reads the Reporting API shape too", () => {
		const line = noteCspReport(
			JSON.stringify([
				{
					type: "csp-violation",
					body: {
						effectiveDirective: "img-src",
						blockedURL: "https://img.example/x.png",
						documentURL: "https://portail.example/",
					},
				},
			])
		);

		expect(line).toContain("directive=img-src blocked=https://img.example/x.png");
	});

	it.each(["not json", "{}", "[]", "null", '{"csp-report":"text"}'])(
		"drops %p, and says it dropped one",
		(raw) => {
			expect(noteCspReport(raw)).toBeNull();
			expect(warn).toHaveBeenCalledTimes(1);
		}
	);
});

describe("POST /api/csp-report", () => {
	let warn: ReturnType<typeof vi.spyOn>;
	beforeEach(() => {
		forgetCspReports();
		warn = vi.spyOn(console, "warn").mockImplementation(() => {});
	});
	afterEach(() => void warn.mockRestore());

	type PostEvent = Parameters<typeof POST>[0];
	const post = (body: string) =>
		POST({
			request: new Request(`http://portail.test${CSP_REPORT_PATH}`, {
				method: "POST",
				headers: { "content-type": "application/csp-report" },
				body,
			}),
		} as unknown as PostEvent);

	it("answers 204 and logs the violation", async () => {
		const res = await post(
			JSON.stringify({
				"csp-report": { "effective-directive": "style-src", "blocked-uri": "inline" },
			})
		);

		expect(res.status).toBe(204);
		expect(warn.mock.calls[0][0]).toContain("directive=style-src blocked=inline");
	});

	it("drops a body past the limit without reading a violation from it", async () => {
		const res = await post("x".repeat(CSP_REPORT_MAX_BYTES + 1));

		expect(res.status).toBe(204);
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0][0]).toContain("was dropped");
	});
});

describe("the content security policy", () => {
	it("enforces that no other site frames this one", () => {
		expect(CSP.directives).toEqual({ "frame-ancestors": ["self"] });
	});

	it("observes the rest for this release, and reports to the route above", () => {
		expect(CSP.reportOnly["default-src"]).toEqual(["self"]);
		expect(CSP.reportOnly["script-src"]).toContain("self");
		expect(CSP.reportOnly["object-src"]).toEqual(["none"]);
		expect(CSP.reportOnly["report-uri"]).toEqual([CSP_REPORT_PATH]);
	});

	it("names the Canari origin for its pictures and its API, with no path", () => {
		expect(CANARI_ORIGIN).toMatch(/^https?:\/\/[^/]+$/);
		expect(CSP.reportOnly["img-src"]).toContain(CANARI_ORIGIN);
		expect(CSP.reportOnly["connect-src"]).toContain(CANARI_ORIGIN);
	});

	it("names the hash of the template's inline theme script", () => {
		const hashes = appHtmlScriptHashes("<head><script>var a = 1;</script></head>");

		expect(hashes).toEqual(["sha256-+dZ6udsWxNVoGfScAq7t5IIF5UJb4F6RhjbN6oe1p4w="]);
		expect(CSP.reportOnly["script-src"].length).toBeGreaterThan(1);
	});

	it("finds an inline script whatever its casing, attributes and closing tag, and skips one with a src", () => {
		const one = "sha256-+dZ6udsWxNVoGfScAq7t5IIF5UJb4F6RhjbN6oe1p4w=";

		expect(appHtmlScriptHashes('<SCRIPT type="module">var a = 1;</Script >')).toEqual([one]);
		expect(appHtmlScriptHashes('<script src="/a.js"></script><script>var a = 1;</script>')).toEqual(
			[one]
		);
	});
});
