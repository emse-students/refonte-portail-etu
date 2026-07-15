<script lang="ts">
	import type { Snippet } from "svelte";

	/**
	 * Link renderer for bio Markdown. The vitrine has no user-mention or in-app
	 * routing system (unlike Canari's PostMentionLink), so this only needs to
	 * render safe anchors: external http(s) links open in a new tab with
	 * rel="noopener"; relative and mailto links stay in place.
	 */
	interface Props {
		href?: string;
		title?: string;
		children?: Snippet;
	}

	let { href = "", title, children }: Props = $props();

	const isExternal = $derived(/^https?:\/\//i.test(href));
</script>

{#if isExternal}
	<a
		{href}
		{title}
		target="_blank"
		rel="noopener noreferrer"
		class="text-mines-gold underline underline-offset-2 hover:text-mines-navy dark:hover:text-white transition-colors"
	>
		{@render children?.()}
	</a>
{:else}
	<a
		{href}
		{title}
		class="text-mines-gold underline underline-offset-2 hover:text-mines-navy dark:hover:text-white transition-colors"
	>
		{@render children?.()}
	</a>
{/if}
