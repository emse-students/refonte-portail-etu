<script lang="ts">
	import { fade, scale } from "svelte/transition";
	import { browser } from "$app/environment";
	import type { Snippet } from "svelte";

	let {
		open = $bindable(false),
		title,
		children,
	}: {
		open: boolean;
		title?: string;
		children?: Snippet;
	} = $props();

	let modal = $state<HTMLElement | null>(null);
	let pushedState = $state(false);

	function close() {
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape" && open) {
			close();
		}
	}

	function handlePopstate() {
		if (open && pushedState) {
			pushedState = false;
			open = false;
		}
	}

	// Push state when modal opens, pop when it closes
	$effect(() => {
		if (!browser) return;

		if (open && !pushedState) {
			history.pushState({ modal: true }, "");
			pushedState = true;
		} else if (!open && pushedState) {
			history.back();
			pushedState = false;
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} onpopstate={handlePopstate} />

{#if open}
	<div
		class="modal-backdrop"
		onclick={close}
		onkeydown={(e) => {
			if (e.key === "Enter" || e.key === " ") close();
		}}
		role="button"
		tabindex="0"
		aria-label="Fermer la modale"
		transition:fade={{ duration: 200 }}
	>
		<div
			bind:this={modal}
			class="modal"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="0"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			{#if title}
				<header class="modal-header">
					<h3>{title}</h3>
					<button class="close-btn" onclick={close} aria-label="Fermer">&times;</button>
				</header>
			{/if}
			<div class="modal-content">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
		overflow-y: auto;
		padding: 2rem 0;
		cursor: pointer;
	}

	.modal {
		background: white;
		border-radius: 16px;
		width: 90%;
		max-width: 500px;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		margin: auto;
		overflow: visible;
		cursor: default;
	}

	.modal-header {
		padding: 1.5rem 2rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h3 {
		margin: 0;
		color: #2d3748;
		font-size: 1.5rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 2rem;
		line-height: 1;
		color: #a0aec0;
		cursor: pointer;
		padding: 0;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: #4a5568;
	}

	.modal-content {
		padding: 0 2rem 2rem;
		overflow: visible;
	}

	@media (max-width: 640px) {
		.modal {
			width: 95%;
		}

		.modal-header {
			padding: 1rem 1.25rem 0.5rem;
		}

		.modal-content {
			padding: 0 1.25rem 1.25rem;
		}
	}

	:global([data-theme="dark"]) .modal {
		background: var(--bg-secondary, #1f2937);
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.5),
			0 10px 10px -5px rgba(0, 0, 0, 0.4);
	}

	:global([data-theme="dark"]) .modal-header h3 {
		color: var(--text-primary, #f7fafc);
	}

	:global([data-theme="dark"]) .close-btn {
		color: #cbd5e0;
	}

	:global([data-theme="dark"]) .close-btn:hover {
		color: #e2e8f0;
	}
</style>
