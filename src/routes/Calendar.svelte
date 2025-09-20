
<script lang="ts">
// --- Imports and Types ---
import { onMount, tick } from "svelte";
import type { CalendarEvent } from "$lib/types";
import Event from "./Event.svelte";

// --- State ---
// Desktop state
let events: CalendarEvent[] = $state([]); // Events for the current visible range
let loading = $state(true); // Desktop loading state
let weekStart: Date = $state(getStartOfWeek(new Date()));

// Helper: get start of week (Monday)
function getStartOfWeek(date: Date) {
	const d = new Date(date);
	const day = (d.getDay() + 6) % 7; // Monday=0
	d.setDate(d.getDate() - day);
	d.setHours(0,0,0,0);
	return d;
}

// Helper: add days
function addDays(date: Date, days: number) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

// Helper: get visible weeks (4 weeks)
function getVisibleWeeks(start: Date) {
	return Array.from({length: 4}, (_, i) => addDays(start, i * 7));
}

// Helper: get visible days for a week
function getWeekDays(start: Date) {
	return Array.from({length: 7}, (_, i) => addDays(start, i));
}

// Helper: get event for a day
function getEventForDay(dayDate: Date) {
	return events.find((event) =>
		event.start.getFullYear() === dayDate.getFullYear() &&
		event.start.getMonth() === dayDate.getMonth() &&
		event.start.getDate() === dayDate.getDate()
	);
}

// Mobile state
let mobileMonths: { month: number, year: number, events: CalendarEvent[] }[] = $state([]); // List of loaded months (in order)
let loadingMonths = new Set<string>(); // Prevent duplicate loads
let loadingPrev = $state(false); // Show spinner at top
let loadingNext = $state(false); // Show spinner at bottom
let isMobile = false;


// Get the start and end date for a range
function getRange(start: Date, end: Date) {
    return { start, end };
}


// Fetch events for a given range
async function fetchEventsRange(start: Date, end: Date) {
    loading = true;
    const response = await fetch(`/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`);
    let data: CalendarEvent[] = (await response.json()).calendar;
    // Convert event date strings to Date objects
    data = data.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
    }));
    loading = false;
    return data;
}


// Load 4 weeks for desktop view
async function loadWeeks(start: Date) {
    const end = addDays(start, 27); // 4 weeks, 28 days
    events = await fetchEventsRange(start, end);
    weekStart = new Date(start);
}


// Desktop navigation (by week)
async function loadPrevWeek() {
    const newStart = addDays(weekStart, -7);
    await loadWeeks(newStart);
}

async function loadNextWeek() {
    const newStart = addDays(weekStart, 7);
    await loadWeeks(newStart);
}



// Fetch events for a specific month (used in mobile view)
async function fetchEvents(year: number, month: number) {
	const start = new Date(year, month, 1);
	const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
	let data: CalendarEvent[] = await fetchEventsRange(start, end);
	return data;
}

// Load a month for mobile view (prepend = true for previous, false for next)
async function loadMobileMonth(y: number, m: number, prepend = false) {
	const key = `${y}-${m}`;
	// Prevent loading if already loaded or loading
	if (loadingMonths.has(key) || mobileMonths.some(mm => mm.year === y && mm.month === m)) {
		return;
	}
	loadingMonths.add(key);
	const container = document.querySelector('.calendar.mobile-view');
	let prevScrollHeight = container ? container.scrollHeight : 0;
	let prevScrollTop = container ? container.scrollTop : 0;
	if (prepend) {
		loadingPrev = true;
	} else {
		loadingNext = true;
	}
	const data = await fetchEvents(y, m);
	if (prepend) {
		// Prepend month and adjust scroll to keep user at same spot
		mobileMonths = [{ month: m, year: y, events: data }, ...mobileMonths];
		loadingPrev = false;
		await tick();
		if (container) {
			const newScrollHeight = container.scrollHeight;
			container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
		}
	} else {
		// Append month
		mobileMonths = [...mobileMonths, { month: m, year: y, events: data }];
		loadingNext = false;
	}
	loadingMonths.delete(key);
}


// Infinite scroll handler for mobile
function handleMobileScroll(e: UIEvent) {
	const el = e.target as HTMLElement;
	// Prepend previous month if at top
	if (el.scrollTop === 0) {
		const first = mobileMonths[0];
		let m = first.month - 1;
		let y = first.year;
		if (m < 0) { m = 11; y--; }
		loadMobileMonth(y, m, true);
	} else if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
		// Append next month if at bottom
		const last = mobileMonths[mobileMonths.length - 1];
		let m = last.month + 1;
		let y = last.year;
		if (m > 11) { m = 0; y++; }
		loadMobileMonth(y, m);
	}

	// Remove months far from viewport (keep 5 months max, centered on visible area)
	// Find the first visible month
	const months = Array.from(el.querySelectorAll('.mobile-month'));
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
	// Remove months more than 2 away from visible (keep at least 5)
	if (mobileMonths.length > 5) {
		const keepStart = Math.max(0, firstVisible - 2);
		const keepEnd = Math.min(mobileMonths.length, lastVisible + 3);
		if (keepStart > 0 || keepEnd < mobileMonths.length) {
			// Preserve scroll position by measuring offset before and after
			const firstKept = months[keepStart];
			const prevTop = firstKept ? (firstKept as HTMLElement).getBoundingClientRect().top : 0;
			mobileMonths = mobileMonths.slice(keepStart, keepEnd);
			tick().then(() => {
				const newFirstKept = el.querySelectorAll('.mobile-month')[0];
				if (newFirstKept) {
					const newTop = (newFirstKept as HTMLElement).getBoundingClientRect().top;
					el.scrollTop += (newTop - prevTop);
				}
			});
		}
	}
}


// Initial load: detect mobile/desktop and load the right calendar
onMount(async () => {
    isMobile = window.matchMedia("(max-width: 700px)").matches;
    if (isMobile) {
        const now = new Date();
        await loadMobileMonth(now.getFullYear(), now.getMonth());
    } else {
        await loadWeeks(getStartOfWeek(new Date()));
    }
});
</script>

<!-- Loading state (with each rather than if)-->
<div class="calendar-responsive">
		<!-- Desktop: Month navigation -->
		<div class="calendar-nav desktop-view">
			<button class="calendar-arrow" onclick={loadPrevWeek}>&lt;</button>
			<span class="calendar-month-label">
				{(() => {
					const weeks = getVisibleWeeks(weekStart);
					const first = weeks[0];
					const last = addDays(weeks[3], 6);
					const firstLabel = first.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
					const lastLabel = last.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
					return `${firstLabel} - ${lastLabel}`;
				})()}
			</span>
			<button class="calendar-arrow" onclick={loadNextWeek}>&gt;</button>
		</div>
		<table class="calendar desktop-view">
			<tbody>
				{#each getVisibleWeeks(weekStart) as weekStartDate}
					<tr>
						{#each getWeekDays(weekStartDate) as dayDate}
							{@const eventsForDay = events.filter(event => event.start.getFullYear() === dayDate.getFullYear() && event.start.getMonth() === dayDate.getMonth() && event.start.getDate() === dayDate.getDate())}
							<td class="calendar-cell">
								<div class="event-stack">
																	{#each eventsForDay.slice(0, 3) as event, i (event.id)}
																		{@const count = Math.min(eventsForDay.length, 3) }
																		<div class="event-stack-item" style={`--stack-index: ${i}; --stack-count: ${count};`}>
																			<Event {...event} />
																		</div>
																	{/each}
									{#if eventsForDay.length > 3}
										<div class="event-overflow">+{eventsForDay.length - 3} autres</div>
									{/if}
								</div>
														<div class="date-cell">
															{String(dayDate.getDate()).padStart(2, '0')}/{String(dayDate.getMonth() + 1).padStart(2, '0')}
														</div>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
		<!-- Mobile vertical view with infinite scroll -->
		<div class="calendar mobile-view" onscroll={handleMobileScroll} style="overflow-y: auto; max-height: 70vh;">
			{#if loadingPrev}
				<div class="spinner spinner-mobile"></div>
			{/if}
			{#if mobileMonths.length === 0 && loading}
				<div class="spinner spinner-mobile"></div>
			{/if}
			{#each mobileMonths as m}
				<div class="mobile-month">
					<div class="calendar-nav">
						<span class="calendar-month-label">{new Date(m.year, m.month).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
					</div>
					{#each Array(new Date(m.year, m.month + 1, 0).getDate()) as _, dayIdx}
						<div class="mobile-day">
							<div class="mobile-day-header">
								{new Date(m.year, m.month, dayIdx + 1).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
							</div>
							<div class="mobile-day-cell">
								{#each m.events.filter((event) => event.start.getDate() === dayIdx + 1) as event}
									<Event {...event} />
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
	}

	.calendar-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		margin: 1rem 0 0.5rem 0;
	}
	.calendar-arrow {
		background: #1976d2;
		color: #fff;
		border: none;
		border-radius: 50%;
		width: 2.2rem;
		height: 2.2rem;
		font-size: 1.3rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}
	.calendar-arrow:hover {
		background: #1565c0;
	}
	.calendar-month-label {
		font-weight: bold;
		font-size: 1.1rem;
		letter-spacing: 0.02em;
	}

	.mobile-view {
		display: none;
	}

	@media (max-width: 700px) {
		.desktop-view {
			display: none;
		}
		.mobile-view {
			display: block;
		}
		.mobile-month {
			margin-bottom: 2rem;
		}
		.mobile-day {
			border: 1px solid #ddd;
			border-radius: 8px;
			margin-bottom: 1.2rem;
			background: #fff;
			box-shadow: 0 2px 8px rgba(0,0,0,0.04);
		}
		.mobile-day-header {
			background: #f4f4f4;
			font-weight: bold;
			padding: 0.7rem 1rem;
			border-bottom: 1px solid #eee;
			border-radius: 8px 8px 0 0;
		}
		.mobile-day-cell {
			padding: 0.7rem 1rem 0.5rem 1rem;
		}
	}



	.calendar td {
		border: 1px solid #b0b0b0;
		text-align: left;
	}

	.calendar-cell {
		width: 1%;
		height: 110px;
		min-width: 0;
		min-height: 110px;
		max-width: none;
		max-height: 110px;
		vertical-align: top;
		position: relative;
		padding: 4px 4px 2px 4px;
		box-sizing: border-box;
		overflow: hidden;
		word-break: break-word;
	}
	.event-stack {
		position: absolute;
		top: 0; left: 0; right: 0; bottom: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.event-stack-item {
		position: absolute;
		left: 0; right: 0;
		width: 100%;
		min-height: 0;
		top: calc(var(--stack-index) * (100% / var(--stack-count, 1)));
		height: calc(100% / var(--stack-count, 1));
		max-height: calc(100% / var(--stack-count, 1));
		z-index: calc(3 - var(--stack-index));
		transition: top 0.25s cubic-bezier(.4,0,.2,1), height 0.25s cubic-bezier(.4,0,.2,1), max-height 0.25s cubic-bezier(.4,0,.2,1), z-index 0s 0.25s;
		pointer-events: auto;
		cursor: pointer;
		display: flex;
		align-items: stretch;
		justify-content: stretch;
	}

	.event-stack-item:hover,
	.event-stack-item:focus-within {
		top: 0 !important;
		height: 100% !important;
		max-height: 100% !important;
		z-index: 5 !important;
		box-shadow: 0 4px 24px rgba(0,0,0,0.13);
		transition: top 0.25s cubic-bezier(.4,0,.2,1), height 0.25s cubic-bezier(.4,0,.2,1), max-height 0.25s cubic-bezier(.4,0,.2,1), z-index 0s 0s !important;
	}

	.event-overflow {
		position: absolute;
		left: 0; right: 0; bottom: 24px;
		width: 100%;
		text-align: center;
		font-size: 0.85em;
		color: #232946;
		background: rgba(255,255,255,0.7);
		z-index: 5;
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
			z-index: 5;
			pointer-events: none;
			text-align: right;
		}


	.spinner {
		border: 8px solid #f3f3f3;
		border-top: 8px solid #3498db;
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
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>
