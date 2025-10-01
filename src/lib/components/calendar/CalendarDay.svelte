<script lang="ts">
	import type { CalendarEvent } from "$lib/types";
	import Event from "./Event.svelte";
	import { onMount } from "svelte";

	let { dayDate, events }: { dayDate: Date; events: CalendarEvent[] } =
		$props();

	const eventsForDay = $derived(
		events.filter(
			(event) =>
				event.start.getFullYear() === dayDate.getFullYear() &&
				event.start.getMonth() === dayDate.getMonth() &&
				event.start.getDate() === dayDate.getDate()
		)
	);

	const count = $derived(Math.max(eventsForDay.length, 3));
</script>

<div class="calendar-cell">
	<div class="event-stack">
		<div class="date-badge {eventsForDay.length > 0 ? 'fade-on-hover' : ''}">
			<span class="day-number">{dayDate.getDate()}</span>
			<span class="month"
				>{dayDate.toLocaleString(undefined, { month: "short" })}</span
			>
		</div>
		{#each eventsForDay.slice(0, 3) as event, i (event.id)}
			
			<Event {...event} {i} {count} />
			
		{/each}
		{#if eventsForDay.length > 3}
			<div class="event-overflow">+{eventsForDay.length - 3} autres</div>
		{/if}
	</div>
</div>

<style>
	:root {
		--calendar-cell-size: 175px;
		--calendar-max-cell-size: 225px;
	}
	.calendar-cell {
		width: calc(100% / 7);
		min-height: var(--calendar-cell-size);
		min-width: var(--calendar-cell-size);
		max-width: var(--calendar-max-cell-size);
		vertical-align: top;
		position: relative;
		margin: 4px;
		box-sizing: border-box;
		overflow: hidden;
		word-break: break-word;
		background-color: #f0f0f0;
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
		bottom: 24px;
		width: 100%;
		text-align: center;
		font-size: 0.85em;
		color: #232946;
		background: rgba(255, 255, 255, 0.7);
		z-index: 3;
		pointer-events: none;
	}
	.date-badge {
		position: absolute;
		top: 6px;
		left: 8px;
		z-index: 3;
		background: #fff;
		color: #232946;
		border-radius: 8px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
		padding: 2px 10px 2px 8px;
		font-size: 1.05em;
		font-weight: 600;
		display: flex;
		align-items: baseline;
		gap: 0.3em;
		pointer-events: none;
		border: 1px solid #e0e0e0;
		user-select: none;
	}
	.date-badge .day-number,
	.date-badge .month {
		user-select: none;
	}
	.date-badge .day-number {
		font-size: 1.15em;
		font-weight: 700;
		margin-right: 0.15em;
	}
	.date-badge .month {
		font-size: 0.95em;
		text-transform: lowercase;
		color: #888;
		font-weight: 500;
	}

	.fade-on-hover {
		transition: opacity 0.3s 0.15s;
		opacity: 0.4;
	}

	
	.event-stack:hover .fade-on-hover,
	.event-stack:focus-within .fade-on-hover,
	:global .fade-on-hover:has(~ .modal-overlay) {
		opacity: 1;
	}
</style>
