<script lang="ts">
	import Calendar from "$lib/components/calendar/Calendar.svelte";
	import Permission, { hasPermission } from "$lib/permissions";

	// load session
	import { page } from "$app/state";
	let session = page.data.session;
	let user = page.data.userData;
	let eventSubmissionOpen = $derived(page.data.eventSubmissionOpen);

	const canProposeEvent = $derived.by(() => {
		if (!user) return false;
		// Global permission
		if (hasPermission(user.permissions, Permission.EVENTS)) return true;

		// Association permission
		if (user.memberships) {
			return user.memberships.some((m) => hasPermission(m.role.permissions, Permission.EVENTS));
		}
		return false;
	});

	const isGlobalEventManager = $derived.by(() => {
		if (!user) return false;
		return hasPermission(user.permissions, Permission.EVENTS);
	});

	async function closeAndValidate() {
		if (!confirm("Voulez-vous clôturer la soumission et valider TOUS les événements proposés ?"))
			return;

		try {
			const response = await fetch("/api/events/finalize-submission", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			if (!response.ok) throw new Error("Erreur lors de l'opération");

			const result = await response.json();
			alert(result.message || "Opération réussie");

			// Reload page to reflect changes (button disappearance)
			window.location.reload();
		} catch (e) {
			alert("Erreur: " + (e instanceof Error ? e.message : "Erreur inconnue"));
		}
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
	<div class="header-row">
		<h1>
			Bienvenue {session?.user?.name ?? "dans le portail étudiant"} !
		</h1>
		<div class="actions">
			{#if canProposeEvent && eventSubmissionOpen}
				<a href="/events/propose" class="btn-primary">Proposer un événement</a>
			{/if}
			{#if isGlobalEventManager}
				<button class="btn-secondary" onclick={closeAndValidate}>Clôturer & Valider</button>
			{/if}
		</div>
	</div>

	<div class="calendar-fixed-container">
		<Calendar />
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
		color: #7c3aed;
		letter-spacing: -0.02em;
		animation: fadeInDown 0.6s ease-out;
	}

	.header-row {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.header-row h1 {
		margin-bottom: 0;
		width: auto;
	}

	.actions {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.btn-primary {
		background-color: #7c3aed;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		transition: background-color 0.2s;
		white-space: nowrap;
	}

	.btn-primary:hover {
		background-color: #6d28d9;
	}

	.btn-secondary {
		background-color: #ef4444;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		font-weight: 600;
		transition: background-color 0.2s;
		white-space: nowrap;
		font-size: 1rem;
	}

	.btn-secondary:hover {
		background-color: #dc2626;
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
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
		background: #ffffff;
		border-radius: 16px;
		padding: 2rem;
		animation: fadeIn 0.8s ease-out 0.2s backwards;
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
