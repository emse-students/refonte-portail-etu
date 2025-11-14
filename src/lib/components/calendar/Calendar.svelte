<script lang="ts">
	import { onMount, tick } from "svelte";
	import type { RawEvent as CalendarEvent } from "$lib/databasetypes";
	import CalendarDay from "./CalendarDay.svelte";
	import Event from "./Event.svelte";
	import { resolve } from "$app/paths";

	// Desktop state
	let events: CalendarEvent[] = $state([]);
	let weekStart: Date = $state(getStartOfWeek(new Date()));

	$effect(() => {
		console.log("Events updated:", events);
	});

	$effect(() => {
		console.log("Week start changed:", weekStart);
	});

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
	function getVisibleWeeks(start: Date) {
		return Array.from({ length: 4 }, (_, i) => addDays(start, i * 7));
	}
	function getWeekDays(start: Date) {
		return Array.from({ length: 7 }, (_, i) => addDays(start, i));
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
	let isMobile = false;

	async function fetchEventsRange(start: Date, end: Date) {
		const response = await fetch(
			`${resolve("/api/calendar")}?start=${start.toISOString()}&end=${end.toISOString()}`
		);
		let data: CalendarEvent[] = (await response.json());
		return data.map((event) => {
			event.start_date = new Date(event.start_date);
			event.end_date = new Date(event.end_date);
			return event;
		});
	}
	function loadWeeks(start: Date) {
		const end = addDays(start, 27);
		fetchEventsRange(start, end).then((data) => {
			events = data;
			weekStart = new Date(start);
		});
	}
	function loadPrevWeek() {
		loadWeeks(addDays(weekStart, -7));
	}
	function loadNextWeek() {
		loadWeeks(addDays(weekStart, 7));
	}

	// Mobile infinite scroll
	async function fetchEvents(year: number, month: number) {
		const start = new Date(year, month, 1);
		const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
		let data: CalendarEvent[] = await fetchEventsRange(start, end);
		return data;
	}
	async function loadMobileMonth(y: number, m: number, prepend = false) {
		const key = `${y}-${m}`;
		if (
			loadingMonths.has(key) ||
			mobileMonths.some((mm) => mm.year === y && mm.month === m)
		) {
			return;
		}
		loadingMonths.add(key);
		const container = document.querySelector(".calendar.mobile-view");
		let prevScrollHeight = container ? container.scrollHeight : 0;
		let prevScrollTop = container ? container.scrollTop : 0;
		if (prepend) {
			loadingPrev = true;
		} else {
			loadingNext = true;
		}
		const data = await fetchEvents(y, m);
		if (prepend) {
			mobileMonths = [
				{ month: m, year: y, events: data },
				...mobileMonths,
			];
			loadingPrev = false;
			await tick();
			if (container) {
				const newScrollHeight = container.scrollHeight;
				container.scrollTop =
					newScrollHeight - prevScrollHeight + prevScrollTop;
			}
		} else {
			mobileMonths = [
				...mobileMonths,
				{ month: m, year: y, events: data },
			];
			loadingNext = false;
		}
		loadingMonths.delete(key);
	}
	function handleMobileScroll(e: UIEvent) {
		const el = e.target as HTMLElement;
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
		if (mobileMonths.length > 5) {
			const keepStart = Math.max(0, firstVisible - 2);
			const keepEnd = Math.min(mobileMonths.length, lastVisible + 3);
			if (keepStart > 0 || keepEnd < mobileMonths.length) {
				const firstKept = months[keepStart];
				const prevTop = firstKept
					? (firstKept as HTMLElement).getBoundingClientRect().top
					: 0;
				mobileMonths = mobileMonths.slice(keepStart, keepEnd);
				tick().then(() => {
					const newFirstKept =
						el.querySelectorAll(".mobile-month")[0];
					if (newFirstKept) {
						const newTop = (
							newFirstKept as HTMLElement
						).getBoundingClientRect().top;
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
			loadWeeks(getStartOfWeek(new Date()));
		}
	});
</script>

<div class="calendar-responsive">
	<!-- Desktop: Month navigation -->
	<div class="calendar-nav">
		<button
			class="calendar-arrow"
			onclick={loadPrevWeek}
			aria-label="Semaine précédente"
		>
			<svg
				width="28"
				height="28"
				viewBox="0 0 28 28"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle
					cx="14"
					cy="14"
					r="13"
					stroke="#b388ff"
					stroke-width="2"
					fill="#fff"
				/>
				<path
					d="M16.5 9L12 14L16.5 19"
					stroke="#b388ff"
					stroke-width="2.2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
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
		<button
			class="calendar-arrow"
			onclick={loadNextWeek}
			aria-label="Semaine suivante"
		>
			<svg
				width="28"
				height="28"
				viewBox="0 0 28 28"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle
					cx="14"
					cy="14"
					r="13"
					stroke="#b388ff"
					stroke-width="2"
					fill="#fff"
				/>
				<path
					d="M11.5 9L16 14L11.5 19"
					stroke="#b388ff"
					stroke-width="2.2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	</div>
	<div class="calendar-table-wrapper">
		
			<table class="calendar desktop-view">
				<thead>
					<tr class="calendar-weekdays-row">
						{#each getWeekDays(weekStart) as dayDate}
							<th class="calendar-weekday-header">
								{dayDate.toLocaleDateString(undefined, { weekday: 'long' })}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each getVisibleWeeks(weekStart) as weekStartDate}
						<tr>
							{#each getWeekDays(weekStartDate) as dayDate}
								<td>
									<CalendarDay {dayDate} {events} />
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
	</div>

	<!-- Mobile vertical view with infinite scroll -->
	<div
		class="calendar mobile-view"
		onscroll={handleMobileScroll}
		style="overflow-y: auto; max-height: 70vh;"
	>
		{#if loadingPrev}
			<div class="spinner spinner-mobile"></div>
		{/if}
		{#each mobileMonths as m}
			<div class="mobile-month">
				<div class="calendar-nav">
					<span class="calendar-month-label"
						>{new Date(m.year, m.month).toLocaleString(undefined, {
							month: "long",
							year: "numeric",
						})}</span
					>
				</div>
				{#each Array(new Date(m.year, m.month + 1, 0).getDate()) as _, dayIdx}
					<div class="mobile-day">
						<div class="mobile-day-header">
							{new Date(
								m.year,
								m.month,
								dayIdx + 1
							).toLocaleDateString(undefined, {
								weekday: "long",
								day: "numeric",
								month: "short",
							})}
						</div>
						<div class="mobile-day-cell">
							{#each m.events.filter((event) => event.start_date.getDate() === dayIdx + 1) as event}
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

<style lang="scss">
	.calendar {
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
		gap: 2.2rem;
		margin: 1.5rem 0 1.2rem 0;
		background: linear-gradient(90deg, #f7f3ff 0%, #f3f7ff 100%);
		border-radius: 18px;
		box-shadow: 0 2px 12px rgba(179, 136, 255, 0.07);
		padding: 1.1rem 2.2rem 1.1rem 2.2rem;
	}
	.calendar-title {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.18em;
		font-family: "Inter", "Segoe UI", Arial, sans-serif;
	}
	.calendar-title-main {
		font-size: 1.45rem;
		font-weight: 800;
		color: #6c3fc5;
		letter-spacing: 0.01em;
		margin-bottom: 0.1em;
		text-shadow:
			0 1px 0 #fff,
			0 2px 8px #e6d6ff44;
	}
	.calendar-title-sub {
		font-size: 1.05rem;
		color: #232946;
		font-weight: 500;
		letter-spacing: 0.01em;
		margin-top: 0.1em;
		b {
			color: #b388ff;
			font-weight: 700;
		}
	}
	.calendar-arrow {
		background: none;
		border: none;
		border-radius: 50%;
		width: 2.8rem;
		height: 2.8rem;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			box-shadow 0.18s,
			background 0.18s;
		box-shadow: 0 1px 6px #b388ff22;
		outline: none;
		:hover, :focus {
			background: #f3eaff;
			box-shadow: 0 2px 12px #b388ff44;
		}

		svg {
			display: block;
		}
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
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.calendar-table-wrapper {
		position: relative;
	}

	.calendar-weekdays-row {
		background: linear-gradient(90deg, #f7f3ff 0%, #f7f3ff 100%);
	}
	.calendar-weekday-header {
		font-family: "Inter", "Segoe UI", Arial, sans-serif;
		font-size: 1.08rem;
		font-weight: 700;
		color: #6c3fc5;
		letter-spacing: 0.01em;
		padding: 0.7em 0 0.7em 0;
		text-align: center;
		border-bottom: 2px solid #e6d6ff;
		background: none;
		text-transform: capitalize;
	}
</style>
