<script lang="ts">
	import SvelteMarkdown, { allowHtmlOnly } from "@humanspeak/svelte-markdown";
	import BioLink from "./BioLink.svelte";
	import { normalizeBioLineBreaks } from "$lib/markdown";

	/**
	 * Renders an association/list bio (Markdown) exactly like Canari's
	 * ProfileBioMarkdown: same library and gfm+breaks options, same single-newline
	 * normalization. Mentions/hashtags/code highlighting are Canari-only features
	 * with no counterpart in this read-only vitrine, so they are omitted.
	 */
	interface Props {
		/** Raw bio text (Markdown). */
		source: string;
		/** Extra classes on the prose wrapper. */
		class?: string;
	}

	let { source, class: className = "" }: Props = $props();

	const rendered = $derived(normalizeBioLineBreaks(source.trim()));
	/**
	 * THE HTML ALLOWLIST IS EMPTY, AND IT IS NOT DECORATION.
	 *
	 * A bio is written on Canari and displayed here, so the trust boundary is several hops away and
	 * nothing on this read-only site vets the text. Measured on 2026-08-31 with this same library:
	 * without this line `<div id="x">` and `<iframe src="https://evil.example">` were both built as
	 * REAL ELEMENTS, the iframe keeping its `src`. Handlers and script execution were already
	 * blocked, so this was never XSS - but an association bio could frame an arbitrary third-party
	 * page inside this site's layout, and nothing anywhere would have said so.
	 *
	 * An ALLOWLIST rather than a block on `iframe`: a denylist is a list of the attacks somebody
	 * thought of. Raw HTML in a bio renders as TEXT, which is what a visitor should see anyway.
	 * `tests/profileBioMarkdown.test.ts` holds this down.
	 */
	const renderers = { link: BioLink, html: allowHtmlOnly([]) };
</script>

<div class="prose prose-slate dark:prose-invert max-w-none {className}">
	<SvelteMarkdown source={rendered} {renderers} options={{ gfm: true, breaks: true }} />
</div>
