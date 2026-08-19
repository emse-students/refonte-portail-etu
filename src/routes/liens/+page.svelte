<script lang="ts">
	import FeaturedLinks from "$lib/components/FeaturedLinks.svelte";
	import { m } from "$lib/paraglide/messages";
	import { page } from "$app/state";
	import Seo from "$lib/components/Seo.svelte";
	import { breadcrumbNode } from "$lib/seo";
	import { SITE_NAME } from "$lib/site";
</script>

<Seo
	meta={{
		section: m.nav_links(),
		description: m.links_meta_description(),
		jsonLd: [
			breadcrumbNode(page.url.origin, [
				{ name: SITE_NAME, path: "/" },
				{ name: m.nav_links(), path: "/liens" },
			]),
		],
	}}
/>

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
