<script lang="ts">
	let { children, class: className = "", href = undefined, ...rest } = $props();
</script>

{#if href}
	<!-- `href` is a prop, so this component cannot resolve() it: the value arrives already built by
	     the caller and is as often an external URL or a fragment as it is an internal route. The
	     resolution belongs at the call site, which knows which of the three it is passing. -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a {href} class="glass-card block {className}" {...rest}>
		{@render children()}
	</a>
{:else}
	<div class="glass-card {className}" {...rest}>
		{@render children()}
	</div>
{/if}
