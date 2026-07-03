<script lang="ts">
	import FeaturedLinks from "$lib/components/FeaturedLinks.svelte";
</script>

<svelte:head>
	<title>Liens - Vie associative EMSE</title>
	<meta
		name="description"
		content="Les sites et outils de la vie etudiante de l'EMSE : Canari, MiGallery, Sky, Le Cercle."
	/>
</svelte:head>

<div class="page">
	<header class="intro">
		<h1>Liens utiles</h1>
		<p>Les espaces numeriques et outils qui font vivre la communaute etudiante de l'EMSE.</p>
	</header>
	<FeaturedLinks />
</div>

<style>
	.page {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
		width: 100%;
		box-sizing: border-box;
	}

	.intro {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.intro h1 {
		font-size: 2.4rem;
		color: var(--color-primary);
		margin-bottom: 0.5rem;
	}

	.intro p {
		max-width: 42rem;
		margin: 0 auto;
	}
</style>
