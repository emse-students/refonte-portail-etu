<script lang="ts">
	import type { RawEvent as CalendarEvent, FullUser } from "$lib/databasetypes";
	import Event from "./Event.svelte";

	let {
		dayDate,
		events,
		onAddEvent,
		onEventClick,
		user,
	}: {
		dayDate: Date;
		events: CalendarEvent[];
		onAddEvent?: () => void;
		onEventClick?: (event: CalendarEvent) => boolean;
		user?: FullUser;
	} = $props();

	const eventsForDay = $derived(
		events.filter((event) => {
			const dayEnd = new Date(dayDate);
			dayEnd.setHours(23, 59, 59, 999);
			return event.start_date <= dayEnd && event.end_date >= dayDate;
		})
	);

	const count = $derived(Math.min(eventsForDay.length, 3));
</script>

<div class="calendar-cell">
	<div class="event-stack">
		<div class="date-badge {eventsForDay.length > 0 ? 'fade-on-hover' : ''}">
			<span class="day-number">{dayDate.getDate()}</span>
			<span class="month">{dayDate.toLocaleString("fr-FR", { month: "short" })}</span>
		</div>
		{#each eventsForDay.slice(0, 3) as event, i (event.id)}
			<Event {...event} {i} {count} {onEventClick} {user} />
		{/each}
		{#if eventsForDay.length > 3}
			<div class="event-overflow">+{eventsForDay.length - 3} autres</div>
		{/if}
	</div>
	{#if onAddEvent}
		<button
			class="add-event-btn"
			onclick={(e) => {
				e.stopPropagation();
				onAddEvent();
			}}
			aria-label="Ajouter un événement"
		>
			+
		</button>
	{/if}
</div>

<style>
	:root {
		--calendar-cell-size: 150px;
		--calendar-max-cell-size: 200px;
	}
	.calendar-cell {
		height: var(--calendar-cell-size);
		min-width: 120px;
		max-width: var(--calendar-max-cell-size);
		vertical-align: top;
		position: relative;
		margin: 4px;
		box-sizing: border-box;
		overflow: hidden;
		word-break: break-word;
		background-color: var(--bg-secondary);
		border: 1px solid var(--color-bg-1);
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.calendar-cell:hover {
		box-shadow: var(--shadow-md);
	}

	.event-stack {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.event-overflow {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 8px;
		width: 100%;
		text-align: center;
		font-size: 0.8em;
		color: var(--color-primary);
		background: var(--bg-secondary);
		box-shadow: var(--shadow-sm);
		z-index: 3;
		pointer-events: none;
		padding: 4px 0;
		border-radius: 4px;
		margin: 0 8px;
		width: calc(100% - 16px);
		font-weight: 600;
	}

	.date-badge {
		position: absolute;
		top: 8px;
		left: 10px;
		z-index: 3;
		background: var(--bg-secondary);
		color: var(--color-text);
		border-radius: 6px;
		box-shadow: var(--shadow-sm);
		padding: 4px 10px;
		font-size: 0.95em;
		font-weight: 600;
		display: flex;
		align-items: baseline;
		gap: 0.35em;
		pointer-events: none;
		border: 1px solid var(--color-bg-1);
		user-select: none;
	}

	.date-badge .day-number,
	.date-badge .month {
		user-select: none;
	}
	.date-badge .day-number {
		font-size: 1.1em;
		font-weight: 700;
		color: var(--color-primary);
	}

	.date-badge .month {
		font-size: 0.9em;
		text-transform: lowercase;
		color: var(--color-text-light);
		font-weight: 500;
	}

	.fade-on-hover {
		transition: opacity 0.2s ease;
		opacity: 0.5;
	}

	.event-stack:hover .fade-on-hover,
	.event-stack:focus-within .fade-on-hover,
	:global .fade-on-hover:has(~ .modal-overlay) {
		opacity: 1;
	}

	.add-event-btn {
		position: absolute;
		bottom: 8px;
		left: 8px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background-color: var(--color-secondary);
		color: white;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
		line-height: 1;
		cursor: pointer;
		opacity: 0;
		transform: scale(0.8);
		transition: all 0.2s ease;
		z-index: 10;
		padding: 0;
		padding-bottom: 2px; /* Visual adjustment for + sign */
	}

	.calendar-cell:hover .add-event-btn {
		opacity: 1;
		transform: scale(1);
	}

	.add-event-btn:hover {
		background-color: var(--color-secondary);
		filter: brightness(0.9);
		transform: scale(1.1);
	}
</style>
