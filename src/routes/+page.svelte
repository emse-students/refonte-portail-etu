<script lang="ts">
	import FeaturedLinks from "$lib/components/FeaturedLinks.svelte";
	import AssociationCard from "$lib/components/AssociationCard.svelte";
	import { featuredLinks } from "$lib/links";
	import { reveal } from "$lib/actions/reveal";
	import { pageTitle, SITE_TAGLINE } from "$lib/site";

	let { data } = $props();

	// A small, stable preview of associative life on the landing page.
	const preview = $derived(data.associations.slice(0, 8));
</script>

<svelte:head>
	<title>{pageTitle()}</title>
	<meta name="description" content={SITE_TAGLINE} />
</svelte:head>

<section class="hero">
	<div class="hero-glow" aria-hidden="true"></div>
	<div class="hero-inner" use:reveal>
		<p class="eyebrow">École des Mines de Saint-Étienne</p>
		<h1>
			Le <span class="grad">Portail Étudiant</span><br />de la Maison des Élèves
		</h1>
		<p class="lead">
			Associations, listes de campagne et outils numériques : la face ouverte de
			<strong>Canari</strong>, le réseau de la vie associative de l'ICM.
		</p>
		<div class="cta-row">
			<a class="btn-primary" href="/associations">Explorer les associations</a>
			<a class="btn-ghost" href="https://canari-emse.fr" target="_blank" rel="noopener noreferrer">
				Ouvrir Canari
			</a>
		</div>
		<dl class="stats">
			<div>
				<dt>{data.associations.length}</dt>
				<dd>associations actives</dd>
			</div>
			<div>
				<dt>{data.listCount}</dt>
				<dd>listes de campagne</dd>
			</div>
			<div>
				<dt>{featuredLinks.length}</dt>
				<dd>outils étudiants</dd>
			</div>
		</dl>
	</div>
</section>

<section class="block" use:reveal>
	<div class="block-head">
		<h2>L'écosystème étudiant</h2>
		<p>Les outils et espaces qui font vivre le campus.</p>
	</div>
	<FeaturedLinks />
</section>

{#if preview.length > 0}
	<section class="block" use:reveal>
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
		padding: 5rem 1.5rem 3.5rem;
		text-align: center;
		overflow: hidden;
	}

	/* Soft off-center glow behind the hero copy; drifts slowly, disabled below. */
	.hero-glow {
		position: absolute;
		top: -30%;
		left: 50%;
		width: min(760px, 90vw);
		aspect-ratio: 1;
		transform: translateX(-50%);
		background: radial-gradient(
			circle,
			rgba(224, 159, 62, 0.18) 0%,
			rgba(65, 90, 119, 0.1) 45%,
			transparent 70%
		);
		filter: blur(8px);
		pointer-events: none;
		z-index: 0;
	}

	.hero-inner {
		position: relative;
		z-index: 1;
		max-width: 780px;
		margin: 0 auto;
	}

	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-secondary);
		margin: 0 0 0.9rem;
	}

	.hero h1 {
		font-size: clamp(2.1rem, 5.5vw, 3.2rem);
		line-height: 1.08;
		letter-spacing: -0.02em;
		color: var(--color-primary);
		margin-bottom: 1.1rem;
	}

	.grad {
		background: linear-gradient(120deg, var(--color-secondary), var(--color-primary-light));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.lead {
		font-size: 1.12rem;
		max-width: 44rem;
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
			transform var(--motion-fast) ease,
			box-shadow var(--motion-fast) ease;
	}

	.btn-ghost:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1.25rem 2.5rem;
		margin: 2.75rem 0 0;
	}

	.stats div {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stats dt {
		font-size: 1.9rem;
		font-weight: 700;
		line-height: 1;
		color: var(--color-primary);
	}

	.stats dd {
		margin: 0.35rem 0 0;
		font-size: 0.85rem;
		color: var(--color-text-light);
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

	@media (prefers-reduced-motion: no-preference) {
		.hero-glow {
			animation: drift 14s ease-in-out infinite alternate;
		}

		@keyframes drift {
			from {
				transform: translateX(-50%) translateY(0) scale(1);
			}
			to {
				transform: translateX(-50%) translateY(18px) scale(1.06);
			}
		}
	}
</style>
