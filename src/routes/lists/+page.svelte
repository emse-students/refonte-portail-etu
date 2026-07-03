<script lang="ts">
	import AssociationCard from "$lib/components/AssociationCard.svelte";
	import type { CanariAssociation } from "$lib/types";

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
	<title>Listes - Vie associative EMSE</title>
	<meta name="description" content="Les listes de campagne des promotions de l'EMSE." />
</svelte:head>

<div class="page">
	<header class="intro">
		<h1>Listes de campagne</h1>
		<p>Les listes qui animent les campagnes BDE, BDS et BDA, promotion apres promotion.</p>
	</header>

	{#each sections as section (section.promo)}
		<section>
			<h2>{section.promo === 0 ? "Promotion non precisee" : `Campagnes ${section.promo}`}</h2>
			<div class="grid">
				{#each section.lists as list (list.id)}
					<AssociationCard association={list} base="/lists" />
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.page {
		max-width: 1200px;
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

	section {
		margin-bottom: 2.5rem;
	}

	h2 {
		display: inline-block;
		margin: 0 0 1.25rem;
		padding: 0.4rem 1rem;
		font-size: 1.15rem;
		color: var(--color-text-on-primary);
		background: var(--color-primary);
		border-radius: 999px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
	}
</style>
