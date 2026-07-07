<script lang="ts">
	let { children, class: className = "", href = undefined, ...rest } = $props();
</script>

{#if href}
	<a {href} class="glass-card block {className}" {...rest}>
		{@render children()}
	</a>
{:else}
	<div class="glass-card {className}" {...rest}>
		{@render children()}
	</div>
{/if}
