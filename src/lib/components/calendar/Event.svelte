<script lang="ts">
	import type { CalendarEvent } from "$lib/types";
	import { pushState } from "$app/navigation";
	import { page } from "$app/state";
	let {
		title,
		start,
		end,
		location,
		description,
		association,
		id,
		className,
		style,
	}: CalendarEvent & { className?: string; style?: string } = $props();

	const palette = [
		"#f7c873",
		"#7ec4cf",
		"#b388ff",
		"#ffb4a2",
		"#a3d977",
		"#ffb300",
		"#90caf9",
		"#ff8a65",
		"#ce93d8",
		"#ffd54f",
	];
	let color =
		palette[
			(id
				? Array.from(id).reduce((a, c) => a + c.charCodeAt(0), 0)
				: title.length) % palette.length
		];

	let showModal = $state(false);
	function openModal() {
		showModal = true;
		pushState("", { modalOpen: true });
	}
	function closeModal() {
		showModal = false;
		if (page.state?.modalOpen) {
			history.back();
		}
	}
	if (typeof window !== "undefined") {
		window.addEventListener("popstate", (event) => {
			if (showModal && event.state && event.state.modalOpen) {
				closeModal();
			}
		});
	}
</script>

<div
	class="event-title-only clickable fill-cell {className}"
	role="presentation"
	onclick={openModal}
	onkeydown={(e) => e.key === "Enter" && openModal()}
	title="Voir les détails"
	style="background: {color}; border-radius: 0; {style}"
>
	{title}
</div>

{#if showModal}
	<div class="modal-overlay" role="presentation" onclick={closeModal}>
		<div
			class="modal"
			role="presentation"
			onclick={(event) => event.stopPropagation()}
		>
			<button class="close-btn" onclick={closeModal} aria-label="Fermer"
				>&times;</button
			>
			<div class="modal-content">
				<h2>{title}</h2>
				<div class="modal-section">
					<strong>Date :</strong>
					{start.toLocaleDateString()}
					{start.toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})} - {end.toLocaleDateString()}
					{end.toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})}
				</div>
				{#if location}
					<div class="modal-section">
						<strong>Lieu :</strong>
						{location}
					</div>
				{/if}
				{#if association}
					<div class="modal-section">
						<strong>Association :</strong>
						{association}
					</div>
				{/if}
				{#if description}
					<div class="modal-section">
						<strong>Description :</strong><br />{description}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<div
	class="event-stack-item event-title-only clickable fill-cell"
	role="presentation"
	onclick={openModal}
	onkeydown={(e) => e.key === "Enter" && openModal()}
	title="Voir les détails"
	style="background: {color}; border-radius: 0; --stack-index: {i}; --stack-count: {count};"
>
	{title}
</div>

<style>

	.event-stack-item {
		position: absolute;
		left: 0;
		right: 0;
		width: 100%;
		min-height: 0;
		top: calc(var(--stack-index) * (100% / var(--stack-count, 1)));
		height: calc(100% / var(--stack-count, 1));
		max-height: calc(100% / var(--stack-count, 1));
		z-index: 1;
		transition:
			top 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1)
			z-index 0s 0.25s !important;
		pointer-events: auto;
		cursor: pointer;
		display: flex;
		align-items: stretch;
		justify-content: stretch;
		will-change: top, height, max-height, z-index;
	}

	.event-stack-item:hover,
	.event-stack-item:focus-within,
	.modal-overlay + .event-stack-item {
		top: 0 !important;
		height: 100% !important;
		max-height: 100% !important;
		z-index: 2 !important;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.13);
		transition:
			top 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			z-index 0s 0s;
	}

	.event-title-only {
		font-size: 1rem;
		font-weight: 600;
		color: #232946;
		margin: 0;
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		cursor: pointer;
		border-radius: 0;
		transition: background 0.15s;
		background: var(--event-bg, inherit);
	}
	@media (min-width: 701px) {
		.event-title-only.fill-cell {
			height: 100%;
			width: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 1;
		}
	}
	.event-title-only.clickable:hover,
	.event-title-only.clickable:focus {
		background: rgba(0, 0, 0, 0.07);
		outline: 2px solid #b388ff;
	}
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.35);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal {
		background: #fff;
		border-radius: 12px;
		max-width: 95vw;
		width: 400px;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 4px 32px rgba(0, 0, 0, 0.18);
		position: absolute;
		padding: 2.2rem 1.5rem 1.2rem 1.5rem;
		animation: modalIn 0.18s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 1001;
	}
	@keyframes modalIn {
		from {
			transform: scale(0.95);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	.close-btn {
		position: absolute;
		top: 0.7rem;
		right: 1.1rem;
		background: none;
		border: none;
		font-size: 2rem;
		color: #888;
		cursor: pointer;
		z-index: 10;
		transition: color 0.15s;
	}
	.close-btn:hover,
	.close-btn:focus {
		color: #232946;
	}
	.modal-content {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}
	.modal-section {
		font-size: 1rem;
		color: #232946;
		word-break: break-word;
	}
</style>
