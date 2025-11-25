<script lang="ts">
	import { onMount } from "svelte";
	import Calendar from "$lib/components/calendar/Calendar.svelte";
	import EventForm from "$lib/components/EventForm.svelte";
	import type { Association, List, RawEvent } from "$lib/databasetypes";
	import Permission, { hasPermission } from "$lib/permissions";
	import { page } from "$app/state";

	let { data } = $props();
	let associations = data.associations as Association[];
	let lists = data.lists as List[];
	let user = page.data.userData;
	const isOpen = data.isOpen as boolean;

	let showForm = $state(false);
	let selectedDate = $state<Date | undefined>(undefined);
	let selectedEvent = $state<RawEvent | undefined>(undefined);
	let calendarComponent = $state<Calendar | undefined>(undefined);

	onMount(() => {
		const interval = setInterval(() => {
			calendarComponent?.refresh();
		}, 5000);

		return () => clearInterval(interval);
	});

	function openForm(date?: Date) {
		if (associations.length === 0 && lists.length === 0) {
			alert("Vous n'avez aucune association ou liste pour laquelle proposer un événement.");
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
					m.association === event.association_id &&
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
				(m) => m.list === event.list_id && hasPermission(m.role.permissions, Permission.EVENTS)
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

	async function closeAndValidate() {
		if (!confirm("Voulez-vous clôturer la soumission et valider TOUS les événements proposés ?"))
			return;

		try {
			const response = await fetch("/api/events/finalize-submission", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			if (!response.ok) throw new Error("Erreur lors de l'opération");

			const result = await response.json();
			alert(result.message || "Opération réussie");

			// Reload page to reflect changes (button disappearance)
			window.location.reload();
		} catch (e) {
			alert("Erreur: " + (e instanceof Error ? e.message : "Erreur inconnue"));
		}
	}
</script>

<svelte:head>
	<title>Proposer un événement</title>
</svelte:head>

<div class="container">
	<header class="page-header">
		<h1>Proposer un événement</h1>
		<div class="actions">
			{#if isGlobalEventManager && !isOpen}
				<button class="btn-secondary" onclick={closeAndValidate}>Clôturer & Valider</button>
			{/if}
			<button class="btn-primary" onclick={() => openForm()}>Proposer un événement</button>
		</div>
	</header>

	<div class="calendar-wrapper">
		<Calendar
			bind:this={calendarComponent}
			onDayClick={openForm}
			initialDate={nextMonth}
			onEventClick={handleEventClick}
			showAllUnvalidated={true}
		/>
	</div>
</div>

{#if showForm}
	<EventForm
		{associations}
		{lists}
		initialDate={selectedDate}
		event={selectedEvent}
		{isOpen}
		onClose={() => (showForm = false)}
		onSuccess={() => {
			showForm = false;
			window.location.reload();
		}}
	/>
{/if}

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
		background-color: #7c3aed;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.2s;
	}
	.btn-primary:hover {
		background-color: #6d28d9;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);
	}
	.btn-secondary {
		background-color: #fee2e2;
		color: #ef4444;
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
		background-color: #fecaca;
		color: #dc2626;
	}
</style>
