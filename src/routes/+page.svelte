<script lang="ts">
	import Calendar from "$lib/components/calendar/Calendar.svelte";

	// load session
	import { page } from "$app/state";
	let session = page.data.session;
</script>

<svelte:head>
	<title>Portail Étudiant</title>
	<meta name="description" content="Bienvenue sur le portail étudiant, votre espace personnalisé pour gérer la vie associative de l'école." />
	<meta name="keywords" content="emse, portail étudiant, vie associative, calendrier étudiant, gestion étudiante, ressources étudiantes" />
	<meta name="og:title" content="Portail Étudiant - Votre Espace Personnel" />
	<meta name="og:description" content="Bienvenue sur le portail étudiant, votre espace personnalisé pour gérer la vie associative de l'école." />
	<meta name="og:type" content="website" />
	<meta name="og:url" content="https://portail-etu.emse.fr/" />
	<meta name="og:image" content="https://portail-etu.emse.fr/dev/logo.png" />
</svelte:head>

<section>
	<h1>
		Bienvenue {session?.user?.name ?? 'dans le portail étudiant'} !
	</h1>

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
		background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		letter-spacing: -0.02em;
		animation: fadeInDown 0.6s ease-out;
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
