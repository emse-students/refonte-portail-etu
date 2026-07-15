<script lang="ts">
	import FeaturedLinks from "$lib/components/FeaturedLinks.svelte";
	import { pageTitle } from "$lib/site";
	import { m } from "$lib/paraglide/messages";
</script>

<svelte:head>
	<title>{pageTitle(m.nav_links())}</title>
	<meta name="description" content={m.links_meta_description()} />
</svelte:head>

<div class="max-w-6xl mx-auto px-6 py-10 md:py-16 w-full box-border">
	<header class="text-center mb-12">
		<h1 class="text-3xl md:text-4xl font-heading text-mines-navy dark:text-mines-platinum mb-3">
			{m.links_title()}
		</h1>
		<p class="max-w-2xl mx-auto m-0 text-mines-navy/70 dark:text-mines-platinum/70 text-lg">
			{m.links_subtitle()}
		</p>
	</header>
	<FeaturedLinks />
</div>
