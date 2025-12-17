<script lang="ts">
	import { onMount } from "svelte";
	import Calendar from "$lib/components/calendar/Calendar.svelte";
	import EventForm from "$lib/components/EventForm.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import type { Association, List, RawEvent } from "$lib/databasetypes";
	import Permission, { hasPermission } from "$lib/permissions";
	import { page } from "$app/state";
	import { invalidateAll } from "$app/navigation";

	let { data } = $props();
	// svelte-ignore state_referenced_locally
	let associations = data.associations as Association[];
	// svelte-ignore state_referenced_locally
	let lists = data.lists as List[];
	let user = page.data.userData;
	// svelte-ignore state_referenced_locally
	let isOpen = $state(data.isOpen as boolean);

	let showForm = $state(false);
	let showCloseValidateModal = $state(false);
	let showOpenSubmissionsModal = $state(false);
	let showInfoModal = $state(false);
	let infoModalMessage = $state("");
	let infoModalTitle = $state("");

	let selectedDate = $state<Date | undefined>(undefined);
	let selectedEvent = $state<RawEvent | undefined>(undefined);
	let calendarComponent = $state<Calendar | undefined>(undefined);

	onMount(() => {
		const interval = setInterval(async () => {
			// Refresh calendar every 5 seconds to get latest events
			calendarComponent?.refresh();
			// Also refresh the isOpen state in case it changed
			isOpen = await fetchOpenState();
		}, 5000);

		return () => clearInterval(interval);
	});

	function fetchOpenState(): Promise<boolean> {
		return fetch("/api/events/submission-state")
			.then((res) => res.json())
			.then((data) => data.open as boolean)
			.catch(() => false);
	}

	function openForm(date?: Date) {
		if (associations.length === 0 && lists.length === 0) {
			infoModalTitle = "Information";
			infoModalMessage =
				"Vous n'avez aucune association ou liste pour laquelle proposer un événement.";
			showInfoModal = true;
			return;
		}
		selectedDate = date;
		selectedEvent = undefined;
		showForm = true;
	}

	function handleEventClick(event: RawEvent): boolean {
		if (!user) return false;

		// Check global permission
		if (hasPermission(user.permissions, Permission.EVENTS)) {
			selectedEvent = event;
			showForm = true;
			return true;
		}

		// Check association permission
		if (event.association_id && user.memberships) {
			const hasAssocPerm = user.memberships.some(
				(m) =>
					m.association_id === event.association_id &&
					hasPermission(m.role.permissions, Permission.EVENTS)
			);
			if (hasAssocPerm) {
				selectedEvent = event;
				showForm = true;
				return true;
			}
		}

		// Check list permission
		if (event.list_id && user.memberships) {
			const hasListPerm = user.memberships.some(
				(m) => m.list_id === event.list_id && hasPermission(m.role.permissions, Permission.EVENTS)
			);
			if (hasListPerm) {
				selectedEvent = event;
				showForm = true;
				return true;
			}
		}

		return false;
	}

	// Calculate next month for initial calendar view
	const nextMonth = new Date();
	nextMonth.setMonth(nextMonth.getMonth() + 1);
	nextMonth.setDate(1);

	const isGlobalEventManager = $derived.by(() => {
		if (!user) return false;
		return hasPermission(user.permissions, Permission.EVENTS);
	});

	function requestCloseAndValidate() {
		showCloseValidateModal = true;
	}

	async function confirmCloseAndValidate() {
		try {
			const response = await fetch("/api/events/finalize-submission", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			if (!response.ok) throw new Error("Erreur lors de l'opération");

			const result = await response.json();
			showCloseValidateModal = false;
			infoModalTitle = "Succès";
			infoModalMessage = result.message || "Opération réussie";
			showInfoModal = true;

			// Reload page to reflect changes (button disappearance)
			await invalidateAll();
			isOpen = false;
		} catch (e) {
			showCloseValidateModal = false;
			infoModalTitle = "Erreur";
			infoModalMessage = "Erreur: " + (e instanceof Error ? e.message : "Erreur inconnue");
			showInfoModal = true;
		}
	}

	function requestOpenSubmissions() {
		showOpenSubmissionsModal = true;
	}

	async function confirmOpenSubmissions() {
		try {
			const response = await fetch("/api/events/open-submissions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			if (!response.ok) {
				console.error("Failed to open submissions:", response.statusText);
				throw new Error("Erreur lors de l'opération");
			}

			const result = await response.json();
			showOpenSubmissionsModal = false;
			infoModalTitle = "Succès";
			infoModalMessage = result.message || "Opération réussie";
			showInfoModal = true;

			// Reload page to reflect changes (button disappearance)
			isOpen = true;
			await invalidateAll();
		} catch (e) {
			showOpenSubmissionsModal = false;
			infoModalTitle = "Erreur";
			infoModalMessage = "Erreur: " + (e instanceof Error ? e.message : "Erreur inconnue");
			showInfoModal = true;
		}
	}
</script>

<svelte:head>
	<title>Gestion des événements</title>
</svelte:head>

<div class="container">
	<header class="page-header">
		<h1>Gestion des événements</h1>
		<div class="actions">
			{#if isGlobalEventManager && isOpen}
				<button class="btn-secondary" onclick={requestCloseAndValidate}>Clôturer & Valider</button>
			{/if}
			{#if isGlobalEventManager && !isOpen}
				<button class="btn-primary" onclick={requestOpenSubmissions}>Ouvrir les soumissions</button>
			{/if}
			{#if isOpen || isGlobalEventManager}
				<button class="btn-primary" onclick={() => openForm()}>Proposer un événement</button>
			{/if}
		</div>
	</header>

	<div class="calendar-wrapper">
		<Calendar
			bind:this={calendarComponent}
			onDayClick={isOpen || isGlobalEventManager ? openForm : undefined}
			initialDate={nextMonth}
			onEventClick={handleEventClick}
			showAllUnvalidated={true}
		/>
	</div>

	<Modal
		bind:open={showForm}
		title={selectedEvent ? "Modifier l'événement" : "Proposer un événement"}
	>
		<EventForm
			{associations}
			{lists}
			initialDate={selectedDate}
			event={selectedEvent}
			{isOpen}
			isGlobalAdmin={isGlobalEventManager}
			onClose={() => (showForm = false)}
			onSuccess={() => {
				showForm = false;
				calendarComponent?.refresh();
			}}
		/>
	</Modal>

	<Modal bind:open={showCloseValidateModal} title="Confirmer la clôture">
		<p>Voulez-vous clôturer la soumission et valider TOUS les événements proposés ?</p>
		<div class="modal-actions">
			<button class="cancel-btn" onclick={() => (showCloseValidateModal = false)}>Annuler</button>
			<button class="primary-btn" onclick={confirmCloseAndValidate}>Confirmer</button>
		</div>
	</Modal>

	<Modal bind:open={showOpenSubmissionsModal} title="Ouvrir les soumissions">
		<p>Voulez-vous ouvrir les soumissions d'événements ?</p>
		<div class="modal-actions">
			<button class="cancel-btn" onclick={() => (showOpenSubmissionsModal = false)}>Annuler</button>
			<button class="primary-btn" onclick={confirmOpenSubmissions}>Confirmer</button>
		</div>
	</Modal>

	<Modal bind:open={showInfoModal} title={infoModalTitle}>
		<p>{infoModalMessage}</p>
		<div class="modal-actions">
			<button class="primary-btn" onclick={() => (showInfoModal = false)}>OK</button>
		</div>
	</Modal>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}
	.btn-primary {
		background-color: var(--color-primary);
		color: var(--color-text-on-primary);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.2s;
	}
	.btn-primary:hover {
		background-color: var(--color-primary-dark);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}
	.btn-secondary {
		background-color: var(--color-secondary);
		color: var(--color-primary-dark);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		margin-right: 1rem;
		transition: all 0.2s;
	}
	.btn-secondary:hover {
		filter: brightness(0.95);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
	}

	.cancel-btn {
		padding: 0.75rem 1.5rem;
		background: var(--color-bg-1);
		color: var(--color-text);
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}

	.primary-btn {
		padding: 0.75rem 1.5rem;
		background: var(--color-primary);
		color: var(--color-text-on-primary);
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}

	.primary-btn:hover {
		background: var(--color-primary-dark);
	}
</style>
