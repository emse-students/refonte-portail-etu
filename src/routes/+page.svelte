<script lang="ts">
	import Calendar from "$lib/components/calendar/Calendar.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import Permission, { hasPermission } from "$lib/permissions";

	// load session
	import { page } from "$app/state";
	import type { RawEvent } from "$lib/databasetypes";
	let session = $derived(page.data.session);
	let user = $derived(page.data.userData);
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

	let showCalendarModal = $state(false);
	let isCopied = $state(false);

	const calendarUrl = $derived(`${page.url.origin}/api/calendar/calendar.ics`);
	const googleCalendarUrl = $derived(
		`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(calendarUrl)}`
	);
	const webcalUrl = $derived(calendarUrl.replace(/^https?:/, "webcal:"));

	function copyLink() {
		navigator.clipboard.writeText(calendarUrl);
		isCopied = true;
		setTimeout(() => {
			isCopied = false;
		}, 2000);
	}
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
	<div class="header-container">
		<h1>
			Bienvenue {session?.user?.name ?? "dans le portail étudiant"} !
		</h1>
		<div class="actions">
			<button class="btn-secondary" onclick={() => (showCalendarModal = true)}>
				📅 S'abonner au calendrier
			</button>
			{#if canProposeEvent}
				<a href="/events/propose" class="btn-primary">Gestion d'événements</a>
			{/if}
		</div>
	</div>

	<div class="calendar-fixed-container">
		<Calendar showUnvalidated={true} {initialEvents} {initialDate} />
	</div>

	<Modal bind:open={showCalendarModal} title="Ajouter au calendrier">
		<div style="padding: 1rem;">
			<p>Pour ajouter les événements du portail à votre calendrier personnel :</p>

			<div style="margin-bottom: 2rem;">
				<h3
					style="margin-top: 0; margin-bottom: 0.5rem; font-size: 1.1rem; color: var(--color-primary);"
				>
					Google Agenda / Android
				</h3>
				<a
					href={googleCalendarUrl}
					target="_blank"
					class="btn-primary"
					style="display: block; text-align: center; text-decoration: none; margin-bottom: 1rem;"
				>
					Ajouter à Google Agenda
				</a>

				<details>
					<summary style="cursor: pointer; color: var(--color-text-light);"
						>Ou ajouter manuellement</summary
					>
					<ol style="margin-left: 1.5rem; margin-top: 1rem; margin-bottom: 1rem; line-height: 1.6;">
						<li>Copiez le lien ci-dessous</li>
						<li>
							Ouvrez <a
								href="https://calendar.google.com"
								target="_blank"
								rel="noopener noreferrer"
								style="color: var(--color-primary); text-decoration-line: underline;"
								>Google Agenda</a
							>
						</li>
						<li>
							Dans le menu de gauche, cliquez sur le <strong>+</strong> à côté de "Autres agendas"
						</li>
						<li>Sélectionnez <strong>À partir de l'URL</strong></li>
						<li>Collez le lien et validez</li>
					</ol>

					<div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
						<input
							type="text"
							readonly
							value={calendarUrl}
							style="flex: 1; padding: 0.5rem; border: 1px solid var(--color-bg-1); border-radius: 4px; background: var(--bg-primary); color: var(--color-text);"
							onclick={(e) => e.currentTarget.select()}
						/>
						<button
							class="btn-secondary"
							style="padding: 0.5rem 1rem; min-width: 80px;"
							onclick={copyLink}
						>
							{isCopied ? "Copié !" : "Copier"}
						</button>
					</div>
				</details>
			</div>

			<div>
				<h3
					style="margin-top: 0; margin-bottom: 0.5rem; font-size: 1.1rem; color: var(--color-primary);"
				>
					iOS (Apple Calendar) / Autres
				</h3>
				<p style="margin-bottom: 1rem;">
					Cliquez sur le bouton ci-dessous pour vous abonner automatiquement :
				</p>
				<a
					href={webcalUrl}
					class="btn-primary"
					style="display: block; text-align: center; text-decoration: none;"
				>
					S'abonner automatiquement
				</a>
			</div>

			<div style="display: flex; justify-content: flex-end; margin-top: 2rem;">
				<button class="btn-secondary" onclick={() => (showCalendarModal = false)}>Fermer</button>
			</div>
		</div>
	</Modal>
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
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--color-primary);
		letter-spacing: -0.02em;
		text-align: center;
		margin: 0;
		/* Removed animation to improve LCP */
	}

	.header-container {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 2rem;
		gap: 1.5rem;
	}

	.actions {
		display: flex;
		gap: 1rem;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
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

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg-1);
		color: var(--color-text);
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-md);
		font-weight: 600;
		transition: all 0.2s ease;
		border: 1px solid transparent;
		cursor: pointer;
	}

	.btn-secondary:hover {
		filter: brightness(0.95);
		transform: translateY(-2px);
	}

	.btn-secondary:active {
		transform: translateY(0);
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
