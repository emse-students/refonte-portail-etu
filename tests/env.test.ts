import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * `deploy.yml` writes the runtime `.env`, `src/env.ts` declares what the app reads. A variable in
 * the first and not the second is silently dropped by the app (kit 3 only exposes declared names),
 * so the two lists are compared here rather than trusted to agree.
 */
describe("the runtime environment", () => {
	const deploy = readFileSync(".github/workflows/deploy.yml", "utf8");
	const envTs = readFileSync("src/env.ts", "utf8");

	const written = [...deploy.matchAll(/^\s+([A-Z][A-Z0-9_]+)=\$\{\1\}$/gm)].map((m) => m[1]);
	const declared = [...envTs.matchAll(/^\t([A-Z][A-Z0-9_]+): \{/gm)].map((m) => m[1]);

	it("finds both lists", () => {
		expect(written.length).toBeGreaterThan(0);
		expect(declared.length).toBeGreaterThan(0);
	});

	it("declares every variable deploy.yml writes, and nothing deploy.yml does not write", () => {
		expect([...declared].sort()).toEqual([...written].sort());
	});
});
