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

<div class="page">
	<header class="intro">
		<h1>Vie associative</h1>
		<p>Les associations qui font vivre la Maison des Eleves de l'EMSE.</p>
		<div class="search">
			<Search class="search-icon" width="20" height="20" />
			<input type="text" placeholder="Rechercher une association..." bind:value={query} />
			{#if query}
				<button aria-label="Effacer" onclick={() => (query = "")}>
					<X width="16" height="16" class="" />
				</button>
			{/if}
		</div>
	</header>

	{#if data.failed}
		<div class="notice">
			Le service est momentanement indisponible. Reessayez dans quelques instants.
		</div>
	{/if}

	{#if active.length > 0}
		<div class="grid">
			{#each active as association (association.id)}
				<AssociationCard {association} />
			{/each}
		</div>
	{/if}

	{#if archived.length > 0}
		<h2 class="section">Anciennes associations</h2>
		<div class="grid faded">
			{#each archived as association (association.id)}
				<AssociationCard {association} />
			{/each}
		</div>
	{/if}

	{#if active.length === 0 && archived.length === 0}
		<div class="empty">
			<NoResults width="56" height="56" stroke-width="1.5" class="" />
			<p>Aucune association ne correspond a votre recherche.</p>
		</div>
	{/if}
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
		max-width: 40rem;
		margin: 0 auto 1.75rem;
	}

	.search {
		position: relative;
		max-width: 520px;
		margin: 0 auto;
	}

	:global(.search .search-icon) {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-text-light);
		pointer-events: none;
	}

	.search input {
		width: 100%;
		padding: 0.8rem 3rem;
		border: 1px solid var(--color-bg-2);
		border-radius: 999px;
		background: #fff;
		box-shadow: var(--shadow-sm);
		outline: none;
		transition: border-color 0.2s ease;
	}

	.search input:focus {
		border-color: var(--color-secondary);
	}

	.search button {
		position: absolute;
		right: 0.6rem;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 50%;
		background: var(--color-bg-2);
		color: var(--color-text-light);
	}

	.notice {
		margin-bottom: 1.5rem;
		padding: 1rem 1.25rem;
		border-radius: var(--radius-lg);
		background: #fff7e6;
		border: 1px solid var(--color-secondary);
		color: var(--color-primary-dark);
		text-align: center;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
	}

	.grid.faded {
		opacity: 0.75;
	}

	.section {
		margin: 2.75rem 0 1.25rem;
		font-size: 1.3rem;
		color: var(--color-primary);
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-bg-2);
	}

	.empty {
		text-align: center;
		padding: 4rem 1rem;
		color: var(--color-text-light);
	}
</style>
