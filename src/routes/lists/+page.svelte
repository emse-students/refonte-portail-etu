<script lang="ts">
	import AssociationCard from "$lib/components/AssociationCard.svelte";
	import type { CanariAssociation } from "$lib/types";
	import { pageTitle } from "$lib/site";

	let { data } = $props();

	// Group lists by promo, most recent first; promo-less lists go last under 0.
	const sections = $derived.by(() => {
		const groups = new Map<number, CanariAssociation[]>();
		for (const list of data.lists as CanariAssociation[]) {
			const key = list.promo ?? 0;
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key)!.push(list);
		}
		return [...groups.entries()]
			.map(([promo, lists]) => ({
				promo,
				lists: lists.sort((a, b) => a.name.localeCompare(b.name)),
			}))
			.sort((a, b) => b.promo - a.promo);
	});
</script>

<svelte:head>
	<title>{pageTitle("Listes")}</title>
	<meta name="description" content="Les listes de campagne des promotions de l'EMSE." />
</svelte:head>

<div class="max-w-6xl mx-auto px-6 py-10 md:py-16 w-full box-border">
	<header class="text-center mb-12">
		<h1 class="text-3xl md:text-4xl font-heading text-mines-navy dark:text-mines-platinum mb-3">
			Listes de campagne
		</h1>
		<p class="max-w-2xl mx-auto m-0 text-mines-navy/70 dark:text-mines-platinum/70 text-lg">
			Les listes qui animent les campagnes BDE, BDS et BDA, promotion apres promotion.
		</p>
	</header>

	{#if data.failed}
		<div
			class="mb-8 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-800 dark:text-orange-200 text-center backdrop-blur-sm"
		>
			Le service est momentanement indisponible. Reessayez dans quelques instants.
		</div>
	{/if}

	<div class="flex flex-col gap-12">
		{#each sections as section (section.promo)}
			<section>
				<h2
					class="inline-block m-0 mb-6 px-4 py-2 text-lg font-semibold text-mines-navy-dark bg-mines-gold/30 dark:bg-mines-gold rounded-full shadow-sm border border-mines-gold/40 dark:border-transparent"
				>
					{section.promo === 0 ? "Divers" : `Campagnes ${section.promo}`}
				</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{#each section.lists as list (list.id)}
						<AssociationCard association={list} base="/lists" />
					{/each}
				</div>
			</section>
		{/each}
	</div>
</div>
