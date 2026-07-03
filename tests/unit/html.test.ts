import { describe, it, expect } from "vitest";
import { sanitizeDescription } from "$lib/html";

describe("sanitizeDescription", () => {
	it("returns an empty string for nullish input", () => {
		expect(sanitizeDescription(null)).toBe("");
		expect(sanitizeDescription(undefined)).toBe("");
		expect(sanitizeDescription("")).toBe("");
	});

	it("keeps benign legacy formatting tags", () => {
		const html = "Un <b>gras</b> et un saut<br>de ligne";
		expect(sanitizeDescription(html)).toBe(html);
	});

	it("strips script blocks", () => {
		const out = sanitizeDescription("safe<script>alert(1)</script>end");
		expect(out).not.toContain("<script>");
		expect(out).toContain("safe");
		expect(out).toContain("end");
	});

	it("strips inline event handlers", () => {
		const out = sanitizeDescription('<a href="#" onclick="steal()">x</a>');
		expect(out).not.toContain("onclick");
	});

	it("neutralizes javascript: urls", () => {
		const out = sanitizeDescription('<a href="javascript:evil()">x</a>');
		expect(out).not.toContain("javascript:");
	});
});
