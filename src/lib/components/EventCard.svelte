<script lang="ts">
	import type { RawEvent } from "$lib/databasetypes";

	let { event }: { event: RawEvent } = $props();

	// Formater les dates
	const startDate = new Date(event.start_date);
	const endDate = new Date(event.end_date);

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

	const isSameDay = startDate.toDateString() === endDate.toDateString();
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
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
				<circle cx="12" cy="10" r="3"></circle>
			</svg>
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

	.event-location svg {
		flex-shrink: 0;
		color: var(--color-primary);
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
