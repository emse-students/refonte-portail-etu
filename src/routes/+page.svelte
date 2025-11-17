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
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}
	
	.calendar-fixed-container {
		max-width: 95vw;
		min-height: 420px;
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 2rem 0;
		box-shadow: 0 2px 12px rgba(0,0,0,0.07);
		background: #fff;
		border-radius: 12px;
		padding: 1.5rem;
	}
</style>
