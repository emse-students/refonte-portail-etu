<script lang="ts">
	import type { Association, RawEvent } from "$lib/databasetypes";
	import { pushState } from "$app/navigation";
	import { page } from "$app/state";
	import { resolve } from "$app/paths";
	let {
		title,
		start_date,
		end_date,
		location,
		description,
		association_id,
		i,
		count
	}: RawEvent & { i?: number, count?: number } = $props();

	// get the association name from id (either from page data or fetch it if not available)
	let association_name = $state("");
	let association_handle = $state("");
	let association_link = $derived(resolve(`/associations/${association_handle}`));

	fetch(resolve(`/api/associations/${association_id}`))
				.then((res) => res.json())
				.then((data: Association) => {
					association_name = data.name;
					association_handle = data.handle;
				});

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
			(association_id
				? Array.from(title).reduce((a, c) => a + c.charCodeAt(0), 0)
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
					{start_date.toLocaleDateString()}
					{start_date.toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})} - {end_date.toLocaleDateString()}
					{end_date.toLocaleTimeString([], {
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
				{#if association_name}
					<div class="modal-section">
						<strong>Association :</strong>
						<a href={association_link}>{association_name}</a>
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
	style="background: {color}; --stack-index: {i}; --stack-count: {count};"
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
			all 0s 0.25s,
			top 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
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
			all 0s 0s,
			top 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
	}

	.event-title-only {
		font-size: 0.9rem;
		font-weight: 600;
		color: #1a202c;
		margin: 0;
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		cursor: pointer;
		transition: all 0.2s ease;
		background: var(--event-bg, inherit);
		padding: 0.5rem;
	}
	@media (min-width: 701px) {
		.event-title-only.fill-cell {
			height: 100%;
			width: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			position: absolute;
		}
	}
	.event-title-only.clickable:hover,
	.event-title-only.clickable:focus {
		filter: brightness(0.95);
	}
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: auto;
		animation: fadeIn 0.2s ease;
	}

	.modal {
		background: white;
		border-radius: 16px;
		max-width: 95vw;
		width: 500px;
		max-height: 85vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		position: relative;
		padding: 2.5rem 2rem 2rem 2rem;
		animation: modalIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes modalIn {
		from {
			transform: scale(0.9);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: #f3f4f6;
		border: none;
		width: 36px;
		height: 36px;
		font-size: 1.5rem;
		color: #718096;
		cursor: pointer;
		z-index: 10;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.close-btn:hover,
	.close-btn:focus {
		background: #7c3aed;
		color: white;
	}
	.modal-content {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.modal-content h2 {
		font-size: 1.75rem;
		font-weight: 700;
		color: #1a202c;
		margin: 0 0 0.5rem 0;
		line-height: 1.3;
	}

	.modal-section {
		font-size: 1rem;
		color: #4a5568;
		word-break: break-word;
		line-height: 1.6;
	}

	.modal-section strong {
		color: #7c3aed;
		font-weight: 600;
	}

	.modal-section a {
		color: #7c3aed;
		text-decoration: underline;
		font-weight: 500;
	}

	.modal-section a:hover {
		color: #6d28d9;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
