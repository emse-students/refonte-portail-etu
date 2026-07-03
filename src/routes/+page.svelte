<script lang="ts">
	import FeaturedLinks from "$lib/components/FeaturedLinks.svelte";
	import AssociationCard from "$lib/components/AssociationCard.svelte";

	let { data } = $props();

	// A small, stable preview of associative life on the landing page.
	const preview = $derived(data.associations.slice(0, 8));
</script>

<svelte:head>
	<title>Vie associative EMSE</title>
	<meta
		name="description"
		content="La vitrine de la vie associative de l'Ecole des Mines de Saint-Etienne : associations, listes de campagne et l'ecosysteme Canari."
	/>
</svelte:head>

<section class="hero">
	<div class="hero-inner">
		<p class="eyebrow">Ecole des Mines de Saint-Etienne</p>
		<h1>La vie associative de la Maison des Eleves</h1>
		<p class="lead">
			Decouvrez les associations, les listes de campagne et l'ecosysteme numerique etudiant. Cette
			vitrine est la face ouverte de <strong>Canari</strong>.
		</p>
		<div class="cta-row">
			<a class="btn-primary" href="/associations">Explorer les associations</a>
			<a class="btn-ghost" href="https://canari-emse.fr" target="_blank" rel="noopener noreferrer">
				Ouvrir Canari
			</a>
		</div>
	</div>
</section>

<section class="block">
	<div class="block-head">
		<h2>L'ecosysteme etudiant</h2>
		<p>Les outils et espaces qui font vivre le campus.</p>
	</div>
	<FeaturedLinks />
</section>

{#if preview.length > 0}
	<section class="block">
		<div class="block-head">
			<h2>Les associations</h2>
			<a class="see-all" href="/associations">Tout voir &rarr;</a>
		</div>
		<div class="grid">
			{#each preview as association (association.id)}
				<AssociationCard {association} />
			{/each}
		</div>
	</section>
{/if}

<style>
	.hero {
		position: relative;
		padding: 4.5rem 1.5rem 3.5rem;
		text-align: center;
		overflow: hidden;
	}

	.hero-inner {
		max-width: 760px;
		margin: 0 auto;
	}

	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-secondary);
		margin: 0 0 0.75rem;
	}

	.hero h1 {
		font-size: clamp(2rem, 5vw, 3rem);
		line-height: 1.1;
		color: var(--color-primary);
		margin-bottom: 1rem;
	}

	.lead {
		font-size: 1.1rem;
		max-width: 42rem;
		margin: 0 auto 2rem;
	}

	.cta-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		justify-content: center;
	}

	.btn-ghost {
		display: inline-flex;
		align-items: center;
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-md);
		font-weight: 600;
		color: var(--color-primary);
		background: #fff;
		border: 1px solid var(--color-bg-2);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.btn-ghost:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.block {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
		width: 100%;
		box-sizing: border-box;
	}

	.block-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.block-head h2 {
		font-size: 1.5rem;
		color: var(--color-primary);
	}

	.block-head p {
		margin: 0;
	}

	.see-all {
		color: var(--color-primary-light);
		font-weight: 600;
		white-space: nowrap;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
	}
</style>
