<script lang="ts">
	import type { Association, List, RawEvent } from "$lib/databasetypes";
	import { pushState } from "$app/navigation";
	import { resolve } from "$app/paths";
	let {
		title,
		start_date,
		end_date,
		location,
		description,
		association_id,
		list_id,
		id,
		validated,
		created_at,
		edited_at,
		i,
		count,
		onEventClick,
		mode = "stack",
	}: RawEvent & {
		i?: number;
		count?: number;
		onEventClick?: (event: RawEvent) => boolean;
		mode?: "stack" | "list";
	} = $props();

	// get the association or list name from id
	let entity_name = $state("");
	let entity_handle = $state("");
	let entity_link = $state("");
	let is_list = $state(false);

	// svelte-ignore state_referenced_locally
	if (association_id) {
		fetch(resolve(`/api/associations/${association_id}`))
			.then((res) => res.json())
			.then((data: Association) => {
				entity_name = data.name;
				entity_handle = data.handle;
				entity_link = resolve(`/associations/${entity_handle}`);
			});
	} else if (list_id) {
		is_list = true;
		fetch(resolve(`/api/lists/${list_id}`))
			.then((res) => res.json())
			.then((data: List) => {
				entity_name = data.name;
				entity_handle = data.handle;
				entity_link = resolve(`/lists/${entity_handle}`);
			});
	}

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
	// svelte-ignore state_referenced_locally
	let color = palette[Array.from(title).reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];

	let showModal = $state(false);
	function openModal() {
		showModal = true;
		pushState("", { modalOpen: true });
	}
	function handleClick() {
		if (onEventClick) {
			const handled = onEventClick({
				title,
				start_date,
				end_date,
				location,
				description,
				association_id,
				list_id,
				id,
				validated,
				created_at,
				edited_at,
			});
			if (handled) return;
		}
		openModal();
	}
	function closeModal() {
		showModal = false;
		history.back();
	}
	if (typeof window !== "undefined") {
		window.addEventListener("popstate", () => {
			if (showModal) {
				showModal = false;
			}
		});
	}
</script>

{#if showModal}
	<div class="modal-overlay" role="presentation" onclick={closeModal}>
		<div class="modal" role="presentation" onclick={(event) => event.stopPropagation()}>
			<button class="close-btn" onclick={closeModal} aria-label="Fermer">&times;</button>
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
				{#if entity_name}
					<div class="modal-section">
						<strong>{is_list ? "Liste" : "Association"} :</strong>
						<a href={entity_link}>{entity_name}</a>
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
	class:list-mode={mode === "list"}
	role="presentation"
	onclick={handleClick}
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

	.event-stack-item.list-mode {
		position: relative;
		top: auto;
		height: auto;
		max-height: none;
		margin-bottom: 0.5rem;
		border-radius: 6px;
		padding: 0.75rem;
		text-align: left;
		display: block;
		white-space: normal;
		overflow: visible;
		z-index: 1;
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

	.event-stack-item.list-mode:hover,
	.event-stack-item.list-mode:focus-within {
		top: auto !important;
		height: auto !important;
		max-height: none !important;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
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
		background: var(--color-secondary);
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
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
		line-height: 1.3;
	}

	.modal-section {
		font-size: 1rem;
		color: var(--color-text-light);
		word-break: break-word;
		line-height: 1.6;
	}

	.modal-section strong {
		color: var(--color-primary);
		font-weight: 600;
	}

	.modal-section a {
		color: var(--color-primary);
		text-decoration: underline;
		font-weight: 500;
	}

	.modal-section a:hover {
		color: var(--color-secondary);
	}

	:global([data-theme="dark"]) .modal {
		background: var(--bg-secondary, #1f2937);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
	}

	:global([data-theme="dark"]) .modal-content h2 {
		color: var(--text-primary, #f7fafc);
	}

	:global([data-theme="dark"]) .modal-section {
		color: var(--text-secondary, #cbd5e0);
	}

	:global([data-theme="dark"]) .modal-section strong {
		color: var(--color-text);
	}

	:global([data-theme="dark"]) .modal-section a {
		color: var(--color-text);
	}

	:global([data-theme="dark"]) .close-btn {
		background: var(--color-bg-1);
		color: var(--color-text-light);
	}

	:global([data-theme="dark"]) .close-btn:hover,
	:global([data-theme="dark"]) .close-btn:focus {
		background: var(--color-secondary);
		color: white;
	}

	/* Tone down event pills in dark mode */
	:global([data-theme="dark"]) .event-stack-item {
		filter: brightness(0.85);
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
