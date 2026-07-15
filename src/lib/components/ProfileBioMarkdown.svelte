<script lang="ts">
	import SvelteMarkdown from "@humanspeak/svelte-markdown";
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
	const renderers = { link: BioLink };
</script>

<div class="prose prose-slate dark:prose-invert max-w-none {className}">
	<SvelteMarkdown source={rendered} {renderers} options={{ gfm: true, breaks: true }} />
</div>
