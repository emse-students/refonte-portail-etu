<script lang="ts">
	import Calendar from "$lib/components/calendar/Calendar.svelte";
	import EventForm from "$lib/components/EventForm.svelte";
	import type { Association } from "$lib/databasetypes";

	let { data } = $props();
	let associations = data.associations as Association[];

	let showForm = $state(false);
	let selectedDate = $state<Date | undefined>(undefined);

	function openForm(date?: Date) {
		if (associations.length === 0) {
			alert("Vous n'avez aucune association pour laquelle proposer un événement.");
			return;
		}
		selectedDate = date;
		showForm = true;
	}

	// Calculate next month for initial calendar view
	const nextMonth = new Date();
	nextMonth.setMonth(nextMonth.getMonth() + 1);
	nextMonth.setDate(1);
</script>

<svelte:head>
	<title>Proposer un événement</title>
</svelte:head>

<div class="container">
	<header class="page-header">
		<h1>Proposer un événement</h1>
		<div class="actions">
			<button class="btn-primary" onclick={() => openForm()}>Proposer un événement</button>
		</div>
	</header>

	<div class="calendar-wrapper">
		<Calendar onDayClick={openForm} initialDate={nextMonth} />
	</div>
</div>

{#if showForm}
	<EventForm
		{associations}
		initialDate={selectedDate}
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
		background-color: #007bff;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}
	.btn-primary:hover {
		background-color: #0056b3;
	}
</style>
