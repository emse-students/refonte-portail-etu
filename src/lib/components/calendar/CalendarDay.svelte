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
</script>

<div class="calendar-cell">
	<div class="event-stack">
		<div class="date-badge">
			<span class="day-number">{dayDate.getDate()}</span>
			<span class="month"
				>{dayDate.toLocaleString(undefined, { month: "short" })}</span
			>
		</div>
		{#each eventsForDay.slice(0, 3) as event, i (event.id)}
			{@const count = Math.min(eventsForDay.length, 3)}
			
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
			top 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			z-index 0s 0.25s;
		pointer-events: auto;
		cursor: pointer;
		display: flex;
		align-items: stretch;
		justify-content: stretch;
	}
	.event-stack-item:hover,
	.event-stack-item:focus-within,
    :global .event-stack-item:has(> .modal-overlay) {
		top: 0 !important;
		height: 100% !important;
		max-height: 100% !important;
		z-index: 3 !important;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.13);
		transition:
			top 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			z-index 0s 0s !important;
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
	.date-cell {
		position: absolute;
		bottom: 4px;
		right: 6px;
		font-size: 0.9em;
		color: #6a6a6a;
		background: none;
		border-radius: 0 0 6px 6px;
		padding: 0 2px 2px 4px;
		z-index: 2;
		pointer-events: none;
		text-align: right;
	}
</style>
