
<script lang="ts">
// --- Imports and Types ---
import { onMount, tick } from "svelte";
import type { CalendarEvent } from "$lib/types";

// --- State ---
// Desktop state
let events: CalendarEvent[] = $state([]); // Events for the current desktop month
let loading = $state(true); // Desktop loading state
let month = $state(new Date().getMonth());
let year = $state(new Date().getFullYear());

// Mobile state
let mobileMonths: { month: number, year: number, events: CalendarEvent[] }[] = $state([]); // List of loaded months (in order)
let loadingMonths = new Set<string>(); // Prevent duplicate loads
let loadingPrev = $state(false); // Show spinner at top
let loadingNext = $state(false); // Show spinner at bottom
let isMobile = false;


// Get the start and end date for a month
function getMonthRange(year: number, month: number) {
	const start = new Date(year, month, 1);
	const end = new Date(year, month + 1, 0);
	return { start, end };
}


// Fetch events for a given month/year
async function fetchEvents(year: number, month: number) {
	loading = true;
	const { start, end } = getMonthRange(year, month);
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


// Load a month for desktop view
async function loadMonth(y: number, m: number) {
	events = await fetchEvents(y, m);
	month = m;
	year = y;
}


// Desktop navigation
async function loadPrevMonth() {
	let newMonth = month - 1;
	let newYear = year;
	if (newMonth < 0) {
		newMonth = 11;
		newYear--;
	}
	await loadMonth(newYear, newMonth);
}

async function loadNextMonth() {
	let newMonth = month + 1;
	let newYear = year;
	if (newMonth > 11) {
		newMonth = 0;
		newYear++;
	}
	await loadMonth(newYear, newMonth);
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
function handleMobileScroll(e: Event) {
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
		await loadMonth(year, month);
	}
});
</script>

<!-- Loading state (with each rather than if)-->
<div class="calendar-responsive">
		<!-- Desktop: Month navigation -->
		<div class="calendar-nav desktop-view">
			<button class="calendar-arrow" onclick={loadPrevMonth}>&lt;</button>
			<span class="calendar-month-label">{new Date(year, month).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
			<button class="calendar-arrow" onclick={loadNextMonth}>&gt;</button>
		</div>
		<table class="calendar desktop-view">
			<thead>
				<tr>
					<th>Monday</th>
					<th>Tuesday</th>
					<th>Wednesday</th>
					<th>Thursday</th>
					<th>Friday</th>
					<th>Saturday</th>
					<th>Sunday</th>
				</tr>
			</thead>
			<tbody>
				{#each Array(5) as _, weekIndex}
					<tr>
						{#each Array(7) as _, dayIndex}
							<td>
								{#each events.filter((event) => event.start.getMonth() === month && event.start.getFullYear() === year && event.start.getDay() === (dayIndex + 1) % 7 && Math.floor((event.start.getDate() - 1) / 7) === weekIndex) as event}
									<div class="event">
										<strong>{event.title}</strong><br />
										<small>{event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
									</div>
								{/each}
								<div class="date">
									{new Date(year, month, weekIndex * 7 + dayIndex + 1).toLocaleDateString()}
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
									<div class="event">
										<strong>{event.title}</strong><br />
										<small>{event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
									</div>
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
		max-width: 800px;
		margin: auto;
		border-collapse: collapse;
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
		.event {
			margin-bottom: 0.5rem;
		}
	}

	.calendar th,
	.calendar td {
		border: 1px solid #ddd;
		padding: 8px;
		text-align: left;
	}

	.calendar th {
		background-color: #f4f4f4;
	}

	.event {
		background-color: #e0f7fa;
		margin: 5px 0;
		padding: 5px;
		border-radius: 4px;
	}
	.date {
		text-align: right;
		font-size: 0.8em;
		color: #888;
		margin-top: 10px;
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
