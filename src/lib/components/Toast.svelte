<script lang="ts">
	import { toasts } from "$lib/stores/toast";
	import { flip } from "svelte/animate";
	import { fade, fly } from "svelte/transition";
	import X from "$lib/components/icons/X.svelte";
</script>

<div class="toast-container">
	{#each $toasts as toast (toast.id)}
		<div class="toast toast-{toast.type}" animate:flip in:fly={{ y: 20, duration: 300 }} out:fade>
			<span class="message">{toast.message}</span>
			<button class="close-btn" onclick={() => toasts.remove(toast.id)}>
				<X width="16" height="16" class="close-icon" />
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		pointer-events: none; /* Allow clicking through container */
	}

	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		background: var(--bg-secondary);
		box-shadow: var(--shadow-lg);
		min-width: 300px;
		max-width: 400px;
		border-left: 4px solid var(--color-primary);
		color: var(--color-text);
	}

	.toast-success {
		border-left-color: #10b981;
	}

	.toast-error {
		border-left-color: #ef4444;
	}

	.toast-info {
		border-left-color: var(--color-primary);
	}

	.message {
		font-size: 0.9rem;
		font-weight: 500;
	}

	.close-btn {
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--color-text-light);
		display: flex;
		align-items: center;
	}

	.close-btn:hover {
		color: var(--color-text);
	}
</style>
