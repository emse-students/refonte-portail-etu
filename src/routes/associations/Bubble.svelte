<script lang="ts">
	import type { Association } from "$lib/databasetypes.d.ts";

	let {
		association,
		isSelected,
		onclick,
	}: {
		association: Association;
		isSelected: boolean;
		onclick: (event: MouseEvent) => void;
	} = $props();

	const styleAttr = association.position
		? `top: ${association.position.y}%; left: ${association.position.x}%; background-color: ${association.color};`
		: "";
</script>

<button
	type="button"
	class="bubble bubble-{association.size}"
	class:selected={isSelected}
	aria-pressed={isSelected}
	style={styleAttr}
	onclick={onclick}
>
	<div class="bubble-icon" aria-hidden="true">{association.icon}</div>
	<div class="bubble-name">{association.name}</div>
	<div class="bubble-members">👥 {association.members.length}</div>
</button>
	

<style>
	.bubble {
		position: absolute;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		text-align: center;
		border: 3px solid rgba(255, 255, 255, 0.3);
		backdrop-filter: blur(10px);
		transform: translate(-50%, -50%);
	}
	.bubble:hover {
		transform: translate(-50%, -50%) scale(1.1);
		z-index: 200;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}
	.bubble.selected {
		transform: translate(-50%, -50%) scale(1.15);
		z-index: 250;
		box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.6);
	}
	.bubble.selected::after {
		content: "";
		position: absolute;
		inset: -8px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.8);
		animation: pulse 2s infinite;
	}
	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(1.1);
			opacity: 0;
		}
	}
	.bubble-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}
	.bubble-name {
		font-weight: bold;
		font-size: 0.875rem;
		line-height: 1.2;
		margin-bottom: 0.25rem;
		max-width: 90%;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}
	.bubble-members {
		font-size: 0.75rem;
		opacity: 0.9;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.bubble-large {
		width: 12rem;
		height: 12rem;
	}
	.bubble-medium {
		width: 9rem;
		height: 9rem;
	}
	.bubble-small {
		width: 6.5rem;
		height: 6.5rem;
	}
	.bubble-small .bubble-icon {
		font-size: 1.5rem;
	}
	.bubble-small .bubble-name {
		font-size: 0.75rem;
	}
	.bubble-small .bubble-members {
		font-size: 0.625rem;
	}
</style>
