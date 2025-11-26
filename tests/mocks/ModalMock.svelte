<script lang="ts">
	let { open = $bindable(false), title, children } = $props();
</script>

{#if open}
	<div data-testid="modal-mock" role="dialog" aria-label={title}>
		<h1>{title}</h1>
		{@render children()}
	</div>
{/if}
