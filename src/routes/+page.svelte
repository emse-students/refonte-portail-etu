<script lang="ts">
	import Calendar from "$lib/components/calendar/Calendar.svelte";
	import Permission, { hasPermission } from "$lib/permissions";

	// load session
	import { page } from "$app/state";
	import type { RawEvent } from "$lib/databasetypes";
	let session = page.data.session;
	let user = page.data.userData;
	let initialEvents = $derived(
		page.data.initialEvents?.map((e: RawEvent) => ({
			...e,
			start_date: new Date(e.start_date),
			end_date: new Date(e.end_date),
		})) ?? []
	);
	let initialDate = $derived(page.data.start ? new Date(page.data.start) : undefined);

	const canProposeEvent = $derived.by(() => {
		if (!user) return false;
		// Global permission
		if (hasPermission(user.permissions, Permission.MANAGE)) return true;

		// Association permission
		if (user.memberships) {
			return user.memberships.some((m) => hasPermission(m.permissions, Permission.MANAGE));
		}
		return false;
	});
</script>

<svelte:head>
	<title>Portail Étudiant</title>
	<meta
		name="description"
		content="Bienvenue sur le portail étudiant, votre espace personnalisé pour gérer la vie associative de l'école."
	/>
	<meta
		name="keywords"
		content="emse, portail étudiant, vie associative, calendrier étudiant, gestion étudiante, ressources étudiantes"
	/>
	<meta name="og:title" content="Portail Étudiant - Votre Espace Personnel" />
	<meta
		name="og:description"
		content="Bienvenue sur le portail étudiant, votre espace personnalisé pour gérer la vie associative de l'école."
	/>
	<meta name="og:type" content="website" />
	<meta name="og:url" content="https://portail-etu.emse.fr/" />
	<meta name="og:image" content="https://portail-etu.emse.fr/logo.png" />
</svelte:head>

<section>
	<div class="header-row">
		<h1>
			Bienvenue {session?.user?.name ?? "dans le portail étudiant"} !
		</h1>
		<div class="actions">
			{#if canProposeEvent}
				<a href="/events/propose" class="btn-primary">Gestion d'événements</a>
			{/if}
		</div>
	</div>

	<div class="calendar-fixed-container">
		<Calendar showUnvalidated={true} {initialEvents} {initialDate} />
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		flex: 1;
		padding: 3rem 2rem;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
	}

	h1 {
		width: 100%;
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 2rem;
		color: var(--color-primary);
		letter-spacing: -0.02em;
		/* Removed animation to improve LCP */
	}

	.header-row {
		width: 100%;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		margin-bottom: 2rem;
	}

	.header-row h1 {
		grid-column: 2;
		margin-bottom: 0;
		width: auto;
		text-align: center;
	}

	.actions {
		grid-column: 3;
		justify-self: end;
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		transition: background-color 0.2s;
		white-space: nowrap;
	}

	.btn-primary:hover {
		background-color: var(--color-primary-dark);
	}

	:global([data-theme="dark"]) h1 {
		color: var(--accent-primary);
	}

	:global([data-theme="dark"]) .calendar-fixed-container {
		background: var(--bg-secondary);
		box-shadow: var(--shadow-lg);
	}

	@keyframes fadeInDown {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.calendar-fixed-container {
		width: 100%;
		max-width: 1200px;
		min-height: 450px;
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 0 auto;
		box-shadow: var(--shadow-md);
		background: var(--bg-secondary);
		border-radius: 16px;
		padding: 2rem;
		/* Removed animation to improve LCP */
		overflow: hidden;
		box-sizing: border-box;
	}

	.calendar-fixed-container :global(.calendar-responsive) {
		width: 100%;
		max-width: 100%;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (max-width: 1024px) {
		.calendar-fixed-container {
			padding: 1.5rem;
		}
	}

	@media (max-width: 768px) {
		section {
			padding: 2rem 1rem;
		}

		h1 {
			font-size: 2rem;
			margin-bottom: 1.5rem;
		}

		.calendar-fixed-container {
			padding: 1rem;
			min-height: 400px;
		}
	}

	@media (max-width: 480px) {
		section {
			padding: 1.5rem 0.5rem;
		}

		.calendar-fixed-container {
			padding: 0.75rem;
			border-radius: 12px;
		}
	}
</style>
