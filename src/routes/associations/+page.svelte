<script lang="ts">
	import AssociationCard from "$lib/components/AssociationCard.svelte";
	import Search from "$lib/components/icons/Search.svelte";
	import X from "$lib/components/icons/X.svelte";
	import NoResults from "$lib/components/icons/NoResults.svelte";
	import { pageTitle } from "$lib/site";

	let { data } = $props();

	let query = $state("");

	const filtered = $derived(
		data.associations.filter(
			(a) =>
				a.name.toLowerCase().includes(query.toLowerCase()) ||
				(a.description ?? "").toLowerCase().includes(query.toLowerCase())
		)
	);
	const active = $derived(filtered.filter((a) => !a.archived));
	const archived = $derived(filtered.filter((a) => a.archived));
</script>

<svelte:head>
	<title>{pageTitle("Associations")}</title>
	<meta
		name="description"
		content="Toutes les associations étudiantes de l'École des Mines de Saint-Étienne."
	/>
</svelte:head>

<div class="max-w-6xl mx-auto px-6 py-10 md:py-16 w-full box-border">
	<header class="text-center mb-12">
		<h1 class="text-3xl md:text-4xl font-heading text-mines-platinum mb-3">Vie associative</h1>
		<p class="max-w-2xl mx-auto mb-8 text-mines-platinum/70 text-lg">
			Les associations qui font vivre Mines Saint-Étienne.
		</p>

		<div class="relative max-w-xl mx-auto">
			<Search
				class="absolute left-4 top-1/2 -translate-y-1/2 text-mines-platinum/50 pointer-events-none"
				width="20"
				height="20"
			/>
			<input
				type="text"
				placeholder="Rechercher une association..."
				bind:value={query}
				class="w-full py-3.5 pl-12 pr-12 bg-glass-100 backdrop-blur-md border border-white/20 rounded-full text-mines-platinum placeholder:text-mines-platinum/50 outline-none transition-all duration-300 focus:border-mines-gold focus:bg-glass-200 shadow-lg"
			/>
			{#if query}
				<button
					aria-label="Effacer"
					onclick={() => (query = "")}
					class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-mines-platinum hover:bg-white/20 transition-colors"
				>
					<X width="16" height="16" />
				</button>
			{/if}
		</div>
	</header>

	{#if data.failed}
		<div
			class="mb-8 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-center backdrop-blur-sm"
		>
			Le service est momentanement indisponible. Reessayez dans quelques instants.
		</div>
	{/if}

	{#if active.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{#each active as association (association.id)}
				<AssociationCard {association} />
			{/each}
		</div>
	{/if}

	{#if archived.length > 0}
		<h2 class="mt-16 mb-6 pt-8 border-t border-white/10 text-2xl font-bold text-mines-platinum">
			Anciennes associations
		</h2>
		<div
			class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-60 hover:opacity-100 transition-opacity duration-300"
		>
			{#each archived as association (association.id)}
				<AssociationCard {association} />
			{/each}
		</div>
	{/if}

	{#if active.length === 0 && archived.length === 0}
		<div
			class="py-16 text-center text-mines-platinum/50 flex flex-col items-center justify-center bg-glass-100 rounded-3xl border border-white/5 backdrop-blur-sm"
		>
			<NoResults width="56" height="56" stroke-width="1.5" class="mb-4 opacity-50" />
			<p class="text-lg">Aucune association ne correspond a votre recherche.</p>
		</div>
	{/if}
</div>
