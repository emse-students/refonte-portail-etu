<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		children: Snippet;
		variant?: "primary" | "ghost";
		class?: string;
		href?: string;
		type?: "button" | "submit" | "reset";
		[key: string]: unknown;
	}

	let {
		children,
		variant = "primary",
		class: className = "",
		href = undefined,
		type = "button",
		...rest
	}: Props = $props();

	const baseClass = $derived(variant === "primary" ? "btn-primary" : "btn-ghost");
</script>

{#if href}
	<a {href} class="{baseClass} {className}" {...rest}>
		{@render children()}
	</a>
{:else}
	<button {type} class="{baseClass} {className}" {...rest}>
		{@render children()}
	</button>
{/if}
