<script lang="ts">
	import AssociationCard from "$lib/components/AssociationCard.svelte";
	import CarteVieAsso from "$lib/components/CarteVieAsso.svelte";
	import Search from "$lib/components/icons/Search.svelte";
	import X from "$lib/components/icons/X.svelte";
	import NoResults from "$lib/components/icons/NoResults.svelte";
	import { m } from "$lib/paraglide/messages";
	import { page } from "$app/state";
	import Seo from "$lib/components/Seo.svelte";
	import { breadcrumbNode, itemListNode } from "$lib/seo";
	import { SITE_NAME } from "$lib/site";
	import { fuzzyRank } from "$lib/search/fuzzy";

	let { data } = $props();

	let query = $state("");

	// Ranked, not filtered: closest name first, then the entries whose description merely contains
	// what was typed. `includes` was the whole matcher here until 2026-08-19, so a reader who
	// mistyped a name they could see on the screen was told there was no such association.
	const filtered = $derived(
		fuzzyRank(
			query,
			data.associations,
			(a) => a.name,
			(a) => a.description ?? ""
		)
	);
	const active = $derived(filtered.filter((a) => !a.archived));
	const archived = $derived(filtered.filter((a) => a.archived));
</script>

<Seo
	meta={{
		section: m.nav_associations(),
		description: m.associations_meta_description(),
		jsonLd: [
			breadcrumbNode(page.url.origin, [
				{ name: SITE_NAME, path: "/" },
				{ name: m.nav_associations(), path: "/associations" },
			]),
			// The directory's links only exist after hydration, so the list is stated here as data:
			// this is the crawlable half of the link graph, next to the sitemap.
			itemListNode(
				page.url.origin,
				m.associations_title(),
				data.associations.map((a) => ({ name: a.name, path: `/associations/${a.slug}` }))
			),
		],
	}}
/>

<div class="max-w-6xl mx-auto px-6 py-10 md:py-16 w-full box-border">
	<header class="text-center mb-12">
		<h1 class="text-3xl md:text-4xl font-heading text-mines-navy dark:text-mines-platinum mb-3">
			{m.associations_title()}
		</h1>
		<p class="max-w-2xl mx-auto mb-8 text-mines-navy/70 dark:text-mines-platinum/70 text-lg">
			{m.associations_subtitle()}
		</p>

		<div class="relative max-w-xl mx-auto">
			<Search
				class="absolute left-4 top-1/2 -translate-y-1/2 text-mines-navy/50 dark:text-mines-platinum/50 pointer-events-none"
				width="20"
				height="20"
			/>
			<input
				type="text"
				placeholder={m.associations_search_placeholder()}
				bind:value={query}
				class="w-full py-3.5 pl-12 pr-12 bg-white/40 dark:bg-glass-100 backdrop-blur-md border border-white/60 dark:border-white/20 rounded-full text-mines-navy dark:text-mines-platinum placeholder:text-mines-navy/50 dark:placeholder:text-mines-platinum/50 outline-hidden transition-all duration-300 focus:border-mines-gold focus:bg-white/60 dark:focus:bg-glass-200 shadow-lg"
			/>
			{#if query}
				<button
					aria-label={m.search_clear()}
					onclick={() => (query = "")}
					class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 text-mines-navy dark:text-mines-platinum hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
				>
					<X width="16" height="16" class="" />
				</button>
			{/if}
		</div>
	</header>

	{#if data.failed}
		<div
			class="mb-8 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-800 dark:text-orange-200 text-center backdrop-blur-xs"
		>
			{m.service_unavailable()}
		</div>
	{/if}

	<!--
		The live map, above the tiles. Hidden while a search is running: it shows every association
		regardless of the query, and leaving it up next to filtered tiles would contradict them.
	-->
	{#if data.carte && !query}
		<CarteVieAsso carte={data.carte} associations={data.associations} />
	{/if}

	{#if active.length > 0}
		<div class="flex-grid-4">
			{#each active as association (association.id)}
				<AssociationCard {association} />
			{/each}
		</div>
	{/if}

	{#if archived.length > 0}
		<h2
			class="mt-16 mb-6 pt-8 border-t border-black/10 dark:border-white/10 text-2xl font-bold text-mines-navy dark:text-mines-platinum"
		>
			{m.associations_archived_heading()}
		</h2>
		<div class="flex-grid-4 opacity-60 hover:opacity-100 transition-opacity duration-300">
			{#each archived as association (association.id)}
				<AssociationCard {association} />
			{/each}
		</div>
	{/if}

	{#if active.length === 0 && archived.length === 0}
		<div
			class="py-16 text-center text-mines-navy/50 dark:text-mines-platinum/50 flex flex-col items-center justify-center bg-white/40 dark:bg-glass-100 rounded-3xl border border-white/60 dark:border-white/5 backdrop-blur-xs"
		>
			<NoResults width="56" height="56" stroke-width="1.5" class="mb-4 opacity-50" />
			<p class="text-lg">{m.associations_empty()}</p>
		</div>
	{/if}
</div>
