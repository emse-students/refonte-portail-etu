/**
 * THE GATE THAT LETS THE MARKDOWN RENDERER BE UPGRADED WITHOUT A HUMAN.
 *
 * `ProfileBioMarkdown` renders text this application did not write: association and list bios
 * fetched from Canari's public API. Nothing on this site can edit them, which makes it easy to
 * forget that nothing on this site VETS them either - the trust boundary is Canari's bio editor,
 * several hops away.
 *
 * It is invisible to every other gate here. A `@humanspeak/svelte-markdown` major that changed what
 * it does with raw HTML would typecheck, lint, build and ship, and the suite would stay green. So
 * this file exists to make an escaping regression RED, which is what lets the dependency merge on
 * its own the rest of the time.
 *
 * The positive case is first on purpose: a renderer that escaped EVERYTHING would satisfy every
 * assertion below while showing the visitor nothing.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import ProfileBioMarkdown from "$lib/components/ProfileBioMarkdown.svelte";

describe("ProfileBioMarkdown", () => {
	it("renders ordinary Markdown", () => {
		const { container } = render(ProfileBioMarkdown, {
			props: { source: "A **bold** claim and a [link](https://example.org)." },
		});

		expect(container.querySelector("strong")?.textContent).toBe("bold");
		expect(container.querySelector("a")?.getAttribute("href")).toBe("https://example.org");
	});

	it("does not execute a script tag pasted into a bio", () => {
		const { container } = render(ProfileBioMarkdown, {
			props: { source: "hello <script>window.__pwned = true;</script> there" },
		});

		expect(container.querySelector("script")).toBeNull();
		expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
		// The words around it must survive, and so must the payload - as TEXT. Dropping the whole
		// thing would satisfy the two assertions above while losing what the association wrote.
		expect(container.textContent).toContain("hello");
		expect(container.textContent).toContain("there");
	});

	it("does not build an element out of an inline event handler", () => {
		const { container } = render(ProfileBioMarkdown, {
			props: { source: '<img src="x" onerror="window.__pwned = true">' },
		});

		expect(container.querySelector("img")).toBeNull();
		expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
	});

	it("does not let raw HTML introduce markup of its own", () => {
		// Measured on Sky with the same library on 2026-08-31, where this FAILED: `<div id=...>` and
		// `<iframe src=...>` were both built as real elements, the iframe keeping its `src`. Not an
		// XSS - the library already blocked handlers and script execution - but an association bio
		// could frame an arbitrary third-party page inside this site's layout.
		const { container } = render(ProfileBioMarkdown, {
			props: {
				source:
					'<b>not bold</b> and <div id="injected"></div> and <iframe src="https://evil.example"></iframe>',
			},
		});

		expect(container.querySelector("#injected")).toBeNull();
		expect(container.querySelector("iframe")).toBeNull();
		expect(container.querySelector("b")).toBeNull();
		expect(container.textContent).toContain("not bold");
	});

	it("keeps a single newline as a line break, which is why the normalizer exists", () => {
		// `normalizeBioLineBreaks` turns one Enter into a hard break so a bio reads here exactly as
		// it does on Canari. A renderer that stopped honouring two trailing spaces would silently
		// reflow every bio into one paragraph, with nothing red anywhere.
		const { container } = render(ProfileBioMarkdown, { props: { source: "line one\nline two" } });

		expect(container.querySelector("br")).not.toBeNull();
	});
});
