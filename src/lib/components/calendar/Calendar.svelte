<script lang="ts">
	import { onMount, tick } from "svelte";
	import type { RawEvent as CalendarEvent } from "$lib/databasetypes";
	import CalendarDay from "./CalendarDay.svelte";
	import Event from "./Event.svelte";
	import { resolve } from "$app/paths";
	import ChevronLeft from "$lib/components/icons/ChevronLeft.svelte";
	import ChevronRight from "$lib/components/icons/ChevronRight.svelte";

	let {
		onDayClick,
		initialDate,
		onEventClick,
		showUnvalidated = false,
		showAllUnvalidated = false,
		initialEvents = [],
	}: {
		onDayClick?: (date: Date) => void;
		initialDate?: Date;
		onEventClick?: (event: CalendarEvent) => boolean;
		showUnvalidated?: boolean;
		showAllUnvalidated?: boolean;
		initialEvents?: CalendarEvent[];
	} = $props();

	// Desktop state
	// svelte-ignore state_referenced_locally
	let events: CalendarEvent[] = $state(initialEvents);
	// svelte-ignore state_referenced_locally
	let weekStart: Date = $state(getStartOfWeek(initialDate || new Date()));
	// svelte-ignore state_referenced_locally
	let isLoading = $state(initialEvents.length === 0);

	function getStartOfWeek(date: Date) {
		const d = new Date(date);
		const day = (d.getDay() + 6) % 7;
		d.setDate(d.getDate() - day);
		d.setHours(0, 0, 0, 0);
		return d;
	}

	function addDays(date: Date, days: number) {
		const d = new Date(date);
		d.setDate(d.getDate() + days);
		return d;
	}

	// Pre-compute weeks once when weekStart changes
	const visibleWeeks = $derived(Array.from({ length: 4 }, (_, i) => addDays(weekStart, i * 7)));
	const weekDaysCache = new Map<number, Date[]>();

	function getWeekDays(start: Date): Date[] {
		const key = start.getTime();
		if (!weekDaysCache.has(key)) {
			weekDaysCache.set(
				key,
				Array.from({ length: 7 }, (_, i) => addDays(start, i))
			);
		}
		return weekDaysCache.get(key)!;
	}

	// Mobile state
	let mobileMonths: {
		month: number;
		year: number;
		events: CalendarEvent[];
	}[] = $state([]);
	let loadingMonths = new Set<string>();
	let loadingPrev = $state(false);
	let loadingNext = $state(false);
	let isMobile = $state(false);

	async function fetchEventsRange(start: Date, end: Date): Promise<CalendarEvent[]> {
		const params = new URLSearchParams({
			start: start.toISOString(),
			end: end.toISOString(),
		});
		if (showUnvalidated || showAllUnvalidated) params.set("unvalidated", "true");
		if (showAllUnvalidated) params.set("all", "true");

		const response = await fetch(`${resolve("/api/calendar")}?${params.toString()}`);
		const data: CalendarEvent[] = await response.json();
		return data.map((event) => ({
			...event,
			start_date: new Date(event.start_date),
			end_date: new Date(event.end_date),
		}));
	}

	async function loadWeeks(start: Date) {
		const end = addDays(start, 27);
		const data = await fetchEventsRange(start, end);
		events = data;
		weekStart = new Date(start);
		isLoading = false;
	}

	function loadPrevWeek() {
		loadWeeks(addDays(weekStart, -7));
	}

	function loadNextWeek() {
		loadWeeks(addDays(weekStart, 7));
	}

	// Mobile infinite scroll
	async function fetchEvents(year: number, month: number): Promise<CalendarEvent[]> {
		const start = new Date(year, month, 1);
		const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
		return fetchEventsRange(start, end);
	}

	async function loadMobileMonth(y: number, m: number, prepend = false) {
		const key = `${y}-${m}`;
		if (loadingMonths.has(key) || mobileMonths.some((mm) => mm.year === y && mm.month === m)) {
			return;
		}
		loadingMonths.add(key);
		const container = document.querySelector(".calendar.mobile-view");
		const prevScrollHeight = container ? container.scrollHeight : 0;
		const prevScrollTop = container ? container.scrollTop : 0;

		if (prepend) {
			loadingPrev = true;
		} else {
			loadingNext = true;
		}

		try {
			const data = await fetchEvents(y, m);
			if (prepend) {
				mobileMonths = [{ month: m, year: y, events: data }, ...mobileMonths];
				await tick();
				if (container) {
					const newScrollHeight = container.scrollHeight;
					container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
				}
			} else {
				mobileMonths = [...mobileMonths, { month: m, year: y, events: data }];
			}
		} finally {
			if (prepend) {
				loadingPrev = false;
			} else {
				loadingNext = false;
			}
			loadingMonths.delete(key);
		}
	}

	// Throttle scroll handler for better performance
	let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleMobileScroll(e: UIEvent) {
		if (scrollTimeout) return;

		scrollTimeout = setTimeout(() => {
			scrollTimeout = null;
			processScroll(e);
		}, 100);
	}

	function processScroll(e: UIEvent) {
		const el = e.target as HTMLElement;
		if (!el || mobileMonths.length === 0) return;

		if (el.scrollTop === 0) {
			const first = mobileMonths[0];
			let m = first.month - 1;
			let y = first.year;
			if (m < 0) {
				m = 11;
				y--;
			}
			loadMobileMonth(y, m, true);
		} else if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
			const last = mobileMonths[mobileMonths.length - 1];
			let m = last.month + 1;
			let y = last.year;
			if (m > 11) {
				m = 0;
				y++;
			}
			loadMobileMonth(y, m);
		}

		// Cleanup distant months for memory efficiency
		if (mobileMonths.length > 5) {
			const months = Array.from(el.querySelectorAll(".mobile-month"));
			let firstVisible = 0;
			let lastVisible = months.length - 1;

			for (let i = 0; i < months.length; i++) {
				const rect = (months[i] as HTMLElement).getBoundingClientRect();
				if (rect.bottom > 0 && rect.top < window.innerHeight) {
					firstVisible = i;
					break;
				}
			}

			for (let i = months.length - 1; i >= 0; i--) {
				const rect = (months[i] as HTMLElement).getBoundingClientRect();
				if (rect.top < window.innerHeight && rect.bottom > 0) {
					lastVisible = i;
					break;
				}
			}

			const keepStart = Math.max(0, firstVisible - 2);
			const keepEnd = Math.min(mobileMonths.length, lastVisible + 3);
			if (keepStart > 0 || keepEnd < mobileMonths.length) {
				const firstKept = months[keepStart];
				const prevTop = firstKept ? (firstKept as HTMLElement).getBoundingClientRect().top : 0;
				mobileMonths = mobileMonths.slice(keepStart, keepEnd);
				tick().then(() => {
					const newFirstKept = el.querySelectorAll(".mobile-month")[0];
					if (newFirstKept) {
						const newTop = (newFirstKept as HTMLElement).getBoundingClientRect().top;
						el.scrollTop += newTop - prevTop;
					}
				});
			}
		}
	}

	onMount(async () => {
		isMobile = window.matchMedia("(max-width: 700px)").matches;

		if (isMobile) {
			const now = new Date();
			await loadMobileMonth(now.getFullYear(), now.getMonth());
		} else {
			if (events.length === 0) {
				await loadWeeks(weekStart);
			}
		}
	});

	export function refresh() {
		if (isMobile) {
			// Refresh all currently loaded months
			const promises = mobileMonths.map(async (m) => {
				const data = await fetchEvents(m.year, m.month);
				return { ...m, events: data };
			});
			Promise.all(promises).then((updatedMonths) => {
				mobileMonths = updatedMonths;
			});
		} else {
			loadWeeks(weekStart);
		}
	}
</script>

<div class="calendar-responsive">
	<!-- Desktop: Month navigation -->
	<div class="calendar-nav">
		<button class="calendar-arrow" onclick={loadPrevWeek} aria-label="Semaine précédente">
			<ChevronLeft width="24" height="24" class="" />
		</button>
		<span class="calendar-title">
			<span class="calendar-title-main">Calendrier des événements</span>
			<span class="calendar-title-sub">
				Semaine du <b
					>{weekStart.toLocaleDateString(undefined, {
						day: "2-digit",
						month: "long",
						year: "numeric",
					})}</b
				>
			</span>
		</span>
		<button class="calendar-arrow" onclick={loadNextWeek} aria-label="Semaine suivante">
			<ChevronRight width="24" height="24" class="" />
		</button>
	</div>
	<div class="calendar-table-wrapper">
		<table class="calendar desktop-view">
			<thead>
				<tr class="calendar-weekdays-row">
					{#each getWeekDays(weekStart) as dayDate}
						<th class="calendar-weekday-header">
							{dayDate.toLocaleDateString(undefined, { weekday: "long" })}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if isLoading}
					{#each Array(4) as _}
						<tr>
							{#each Array(7) as __}
								<td>
									<div class="calendar-cell-skeleton"></div>
								</td>
							{/each}
						</tr>
					{/each}
				{:else}
					{#each visibleWeeks as weekStartDate}
						<tr>
							{#each getWeekDays(weekStartDate) as dayDate}
								<td>
									<CalendarDay
										{dayDate}
										{events}
										onAddEvent={onDayClick ? () => onDayClick?.(dayDate) : undefined}
										{onEventClick}
									/>
								</td>
							{/each}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Mobile vertical view with infinite scroll -->
	<div class="calendar mobile-view" onscroll={handleMobileScroll}>
		{#if loadingPrev}
			<div class="spinner spinner-mobile"></div>
		{/if}
		{#each mobileMonths as m}
			<div class="mobile-month">
				<h2 class="calendar-month-label">
					{new Date(m.year, m.month).toLocaleString(undefined, {
						month: "long",
						year: "numeric",
					})}
				</h2>
				{#each Array(new Date(m.year, m.month + 1, 0).getDate()) as _, dayIdx}
					{@const date = new Date(m.year, m.month, dayIdx + 1)}
					{@const dayEnd = new Date(m.year, m.month, dayIdx + 1, 23, 59, 59, 999)}
					{@const isToday = new Date().toDateString() === date.toDateString()}
					{@const dayEvents = m.events.filter(
						(event) => event.start_date <= dayEnd && event.end_date >= date
					)}

					<div class="mobile-day" class:is-today={isToday}>
						<div class="mobile-date-column">
							<span class="day-name"
								>{date.toLocaleDateString(undefined, { weekday: "short" })}</span
							>
							<span class="day-number">{date.getDate()}</span>
						</div>
						<div class="mobile-events-column">
							{#each dayEvents as event}
								<Event {...event} mode="list" />
							{:else}
								<div class="no-events">Rien de prévu</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/each}
		{#if loadingNext}
			<div class="spinner spinner-mobile"></div>
		{/if}
	</div>
</div>

<style>
	.calendar {
		width: 100%;
		max-width: 100%;
		margin: auto;
		border-collapse: collapse;
		table-layout: fixed;
	}
	.calendar-responsive {
		width: 100%;
		max-width: 100%;
		overflow: hidden;
	}
	.calendar-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		margin: 0 0 1.5rem 0;
		background: var(--bg-secondary);
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		padding: 1rem 2rem;
	}
	.calendar-title {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	}
	.calendar-title-main {
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--color-primary);
		letter-spacing: -0.01em;
	}
	.calendar-title-sub {
		font-size: 0.95rem;
		color: var(--color-text-light);
		font-weight: 500;
		letter-spacing: 0;
	}

	.calendar-title-sub b {
		color: var(--color-primary);
		font-weight: 600;
	}
	.calendar-arrow {
		background: var(--bg-secondary);
		border: 1px solid var(--color-bg-2);
		border-radius: 50%;
		width: 3rem;
		height: 3rem;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: var(--shadow-sm);
		outline: none;
		color: var(--color-primary);
	}

	.calendar-arrow:hover {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-text-on-primary);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.mobile-view {
		display: none;
	}

	@media (max-width: 700px) {
		.calendar-nav {
			display: none;
		}
		.desktop-view {
			display: none;
		}
		.mobile-view {
			display: block;
		}
		.calendar-month-label {
			font-size: 1.2rem;
			font-weight: 600;
			color: var(--color-text);
			text-transform: capitalize;
			display: block;
			padding: 1rem;
			background: var(--bg-secondary);
			position: sticky;
			top: 0;
			z-index: 10;
			margin: 0;
			border-bottom: 1px solid var(--color-bg-2);
		}
		.mobile-month {
			margin-bottom: 0;
		}
		.mobile-day {
			display: flex;
			border-bottom: 1px solid var(--color-bg-2);
			background: var(--bg-secondary);
			min-height: 80px;
		}
		.mobile-day.is-today .mobile-date-column .day-number {
			background: var(--color-primary);
			color: var(--color-text-on-primary);
		}
		.mobile-day.is-today .mobile-date-column .day-name {
			color: var(--color-primary);
			font-weight: 700;
		}
		.mobile-date-column {
			width: 60px;
			flex-shrink: 0;
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 1rem 0.5rem;
			gap: 0.25rem;
		}
		.day-name {
			font-size: 0.75rem;
			text-transform: uppercase;
			color: var(--color-text-light);
			font-weight: 500;
		}
		.day-number {
			font-size: 1.25rem;
			font-weight: 500;
			width: 36px;
			height: 36px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 50%;
			color: var(--color-text);
		}
		.mobile-events-column {
			flex: 1;
			padding: 0.75rem 1rem 0.75rem 0;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
		.no-events {
			color: var(--color-text-light);
			font-size: 0.875rem;
			font-style: italic;
			padding: 0.5rem 0;
			opacity: 0.6;
		}
	}

	.spinner {
		border: 8px solid var(--color-bg-2);
		border-top: 8px solid var(--color-primary-light);
		border-radius: 50%;
		width: 60px;
		height: 60px;
		animation: spin 2s ease-in-out infinite;
		margin: 50px auto;
	}
	.spinner-mobile {
		width: 36px;
		height: 36px;
		margin: 16px auto;
		border-width: 5px;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.calendar-table-wrapper {
		position: relative;
		width: 100%;
		overflow-x: auto;
		overflow-y: hidden;
	}

	.calendar-table-wrapper::-webkit-scrollbar {
		height: 8px;
	}

	.calendar-table-wrapper::-webkit-scrollbar-track {
		background: var(--color-bg-2);
		border-radius: 4px;
	}

	.calendar-table-wrapper::-webkit-scrollbar-thumb {
		background: var(--color-primary-light);
		border-radius: 4px;
	}

	.calendar-table-wrapper::-webkit-scrollbar-thumb:hover {
		background: var(--color-primary);
	}

	.calendar-weekdays-row {
		background: var(--color-bg-2);
	}
	.calendar-weekday-header {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-primary);
		letter-spacing: 0;
		padding: 0.75rem 0;
		text-align: center;
		border-bottom: 1px solid var(--color-bg-2);
		background: none;
		text-transform: capitalize;
	}

	/* Skeleton loading for CLS prevention */
	.calendar-cell-skeleton {
		height: 150px;
		min-width: 120px;
		max-width: 200px;
		margin: 4px;
		background: linear-gradient(
			90deg,
			var(--color-bg-2) 25%,
			var(--color-bg-1) 50%,
			var(--color-bg-2) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 8px;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Ensure consistent table height */
	.desktop-view tbody {
		min-height: 640px;
	}

	.desktop-view td {
		height: 158px;
		vertical-align: top;
	}
</style>
