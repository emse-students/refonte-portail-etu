<script lang="ts">
	import type { RawEvent, FullUser } from "$lib/databasetypes";
	import { pushState } from "$app/navigation";
	import { resolve } from "$app/paths";
	import Permission, { hasPermission } from "$lib/permissions";

	let {
		title,
		start_date,
		end_date,
		location,
		description,
		association_id,
		association_name,
		association_handle,
		association_color,
		association_icon,
		list_id,
		list_name,
		list_handle,
		list_color,
		list_icon,
		id,
		validated,
		created_at,
		edited_at,
		i,
		count,
		onEventClick,
		mode = "stack",
		user,
	}: RawEvent & {
		association_name?: string;
		association_handle?: string;
		association_color?: number;
		association_icon?: number;
		list_name?: string;
		list_handle?: string;
		list_color?: number;
		list_icon?: number;
		i?: number;
		count?: number;
		onEventClick?: (event: RawEvent) => boolean;
		mode?: "stack" | "list";
		user?: FullUser;
	} = $props();

	// get the association or list name from id
	let is_list = $derived(!!list_id);
	let entity_name = $derived(association_name || list_name || "");
	let entity_handle = $derived(association_handle || list_handle || "");
	let entity_color = $derived(association_color || list_color);
	let entity_icon = $derived(association_icon || list_icon);
	let entity_link = $derived(
		entity_handle
			? resolve(is_list ? `/lists/${entity_handle}` : `/associations/${entity_handle}`)
			: ""
	);

	const canDuplicate = $derived.by(() => {
		if (!user) return false;
		if (hasPermission(user.permissions, Permission.MANAGE)) return true;

		if (association_id && user.memberships) {
			const member = user.memberships.find((m) => m.association_id === association_id);
			if (member && hasPermission(member.permissions, Permission.MANAGE)) return true;
		}

		if (list_id && user.memberships) {
			const member = user.memberships.find((m) => m.list_id === list_id);
			if (member && hasPermission(member.permissions, Permission.MANAGE)) return true;
		}

		return false;
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

	function intToHex(color: number): string {
		return "#" + color.toString(16).padStart(6, "0");
	}

	function getContrastColor(hexColor: string) {
		const r = parseInt(hexColor.substr(1, 2), 16);
		const g = parseInt(hexColor.substr(3, 2), 16);
		const b = parseInt(hexColor.substr(5, 2), 16);
		const yiq = (r * 299 + g * 587 + b * 114) / 1000;
		return yiq >= 128 ? "#1a202c" : "#ffffff";
	}

	// svelte-ignore state_referenced_locally
	let color = $derived(
		entity_color
			? intToHex(entity_color)
			: palette[Array.from(title).reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length]
	);

	let textColor = $derived(getContrastColor(color));

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
	function duplicateEvent() {
		if (typeof window === "undefined") return;

		const params = new URLSearchParams();
		params.set("title", title);
		if (description) params.set("description", description);
		if (location) params.set("location", location);
		params.set("start_date", start_date.toISOString());
		params.set("end_date", end_date.toISOString());
		if (association_id) params.set("association_id", association_id.toString());
		if (list_id) params.set("list_id", list_id.toString());
		params.set("action", "duplicate");

		window.location.href = `${resolve("/events/propose")}?${params.toString()}`;
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
				<div class="modal-header-actions">
					<h2>{title}</h2>
					{#if canDuplicate}
						<button class="duplicate-btn" onclick={duplicateEvent} title="Dupliquer l'événement">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path
									d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
								></path></svg
							>
						</button>
					{/if}
				</div>
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
						<a href={entity_link} class="entity-link">
							{#if entity_icon}
								<img
									src={resolve(`/api/image/${entity_icon}`)}
									alt=""
									class="entity-icon-small"
									width="24"
									height="24"
								/>
							{/if}
							{entity_name}
						</a>
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
	style="background: {color}; color: {textColor}; --stack-index: {i}; --stack-count: {count};"
>
	<span class="event-title-text">
		{#if entity_icon}
			<img
				src={resolve(`/api/image/${entity_icon}`)}
				alt=""
				class="event-icon"
				width="20"
				height="20"
			/>
		{/if}
		{title}
	</span>
</div>

<style>
	.event-title-text {
		overflow: hidden;
		max-width: 100%;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		text-align: center;
		line-height: 1.2;
		font-size: 0.85rem;
	}

	.event-icon {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		object-fit: cover;
		background: white;
		vertical-align: text-bottom;
		margin-right: 4px;
		display: inline-block;
	}

	.entity-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.entity-icon-small {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		object-fit: cover;
		background: white;
		border: 1px solid var(--color-bg-2);
	}

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

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
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
		margin: 0;
		line-height: 1.3;
		flex: 1;
	}

	.modal-header-actions {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.5rem;
		padding-right: 2rem; /* Make space for close button */
	}

	.duplicate-btn {
		background: transparent;
		border: 1px solid var(--color-text-light);
		color: var(--color-text-light);
		padding: 0.4rem;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.duplicate-btn:hover {
		background: var(--color-bg-2);
		color: var(--color-primary);
		border-color: var(--color-primary);
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

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
