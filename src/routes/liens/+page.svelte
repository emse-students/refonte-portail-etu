<script lang="ts">
	import FeaturedLinks from "$lib/components/FeaturedLinks.svelte";
</script>

<svelte:head>
	<title>Liens - Vie associative EMSE</title>
	<meta
		name="description"
		content="Les sites et outils de la vie étudiante de l'EMSE : Canari, MiGallery, Sky, Le Cercle."
	/>
</svelte:head>

<div class="max-w-6xl mx-auto px-6 py-10 md:py-16 w-full box-border">
	<header class="text-center mb-12">
		<h1 class="text-3xl md:text-4xl font-heading text-mines-navy dark:text-mines-platinum mb-3">
			Liens utiles
		</h1>
		<p class="max-w-2xl mx-auto m-0 text-mines-navy/70 dark:text-mines-platinum/70 text-lg">
			Les espaces numériques et outils qui font vivre la communauté étudiante de l'EMSE.
		</p>
	</header>
	<FeaturedLinks />
</div>
