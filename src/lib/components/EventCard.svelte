<script lang="ts">
	import type { RawEvent } from "$lib/databasetypes";
	import MapPin from "$lib/components/icons/MapPin.svelte";

	let { event }: { event: RawEvent } = $props();

	// Formater les dates
	let startDate = $derived(new Date(event.start_date));
	let endDate = $derived(new Date(event.end_date));

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("fr-FR", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString("fr-FR", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	let isSameDay = $derived(startDate.toDateString() === endDate.toDateString());
</script>

<div class="event-card">
	<div class="event-header">
		<h3 class="event-title">{event.title}</h3>
		<div class="event-date">
			{#if isSameDay}
				<span class="date-text">{formatDate(startDate)}</span>
				<span class="time-text">{formatTime(startDate)} - {formatTime(endDate)}</span>
			{:else}
				<span class="date-text">Du {formatDate(startDate)} au {formatDate(endDate)}</span>
			{/if}
		</div>
	</div>

	{#if event.description}
		<p class="event-description">{event.description}</p>
	{/if}

	{#if event.location}
		<div class="event-location">
			<MapPin width="16" height="16" class="icon" />
			<span>{event.location}</span>
		</div>
	{/if}
</div>

<style>
	.event-card {
		background: var(--bg-secondary);
		border: 1px solid var(--color-bg-1);
		border-radius: 12px;
		padding: 1.5rem;
		transition: all 0.2s ease;
	}

	.event-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		border-color: var(--color-primary-light);
	}

	.event-header {
		margin-bottom: 1rem;
	}

	.event-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.event-date {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.9rem;
		color: var(--color-primary);
	}

	.date-text {
		font-weight: 500;
	}

	.time-text {
		color: var(--color-text-light);
	}

	.event-description {
		color: var(--color-text);
		line-height: 1.6;
		margin: 0 0 1rem 0;
	}

	.event-location {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-light);
		font-size: 0.9rem;
	}

	@media (max-width: 768px) {
		.event-card {
			padding: 1.25rem;
		}

		.event-title {
			font-size: 1.1rem;
		}

		.event-date,
		.event-location {
			font-size: 0.85rem;
		}
	}
</style>
