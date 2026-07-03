<script lang="ts">
	import type { CanariAssociationDetail } from "$lib/types";
	import AssociationLogo from "./AssociationLogo.svelte";
	import MemberCard from "./MemberCard.svelte";
	import { sanitizeDescription } from "$lib/html";

	let {
		entity,
		backHref,
		backLabel,
	}: {
		entity: CanariAssociationDetail;
		/** Directory link to return to. */
		backHref: string;
		backLabel: string;
	} = $props();

	const description = $derived(sanitizeDescription(entity.description));
	// Admins (bureau) first, then regular members; both already ordered by the API.
	const bureau = $derived(entity.members.filter((m) => m.isAdmin));
	const others = $derived(entity.members.filter((m) => !m.isAdmin));
</script>

<article>
	<a class="back" href={backHref}>&larr; {backLabel}</a>

	<header class="hero" style="--accent:{entity.color || 'var(--color-primary)'}">
		<div class="logos">
			<AssociationLogo association={entity} size={104} rounded="24%" />
			{#if entity.type === "list" && entity.name2 && entity.logoMediaId2}
				<AssociationLogo
					association={{
						name: entity.name2,
						logoMediaId: entity.logoMediaId2,
						logoUrl: null,
						color: entity.color,
					}}
					size={104}
					rounded="24%"
				/>
			{/if}
		</div>
		<div>
			{#if entity.type === "list" && entity.parentName}
				<span class="parent">{entity.parentName}</span>
			{/if}
			<h1>
				{entity.name}{#if entity.name2}<span class="alt"> &amp; {entity.name2}</span>{/if}
			</h1>
			<div class="tags">
				{#if entity.type === "list" && entity.promo}
					<span class="tag promo">Campagnes {entity.promo}</span>
				{/if}
				{#if entity.isBDE}
					<span class="tag">BDE</span>
				{/if}
				{#if entity.archived}
					<span class="tag muted">Archivee</span>
				{/if}
				<span class="tag muted">{entity.members.length} membres</span>
			</div>
			{#if entity.contactEmail}
				<a class="contact" href="mailto:{entity.contactEmail}">{entity.contactEmail}</a>
			{/if}
		</div>
	</header>

	{#if description}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<section class="description">{@html description}</section>
	{/if}

	{#if entity.members.length > 0}
		{#if bureau.length > 0}
			<h2>Bureau</h2>
			<div class="grid">
				{#each bureau as m (m.id)}
					<MemberCard member={m} bureau />
				{/each}
			</div>
		{/if}
		{#if others.length > 0}
			<h2>Membres</h2>
			<div class="grid">
				{#each others as m (m.id)}
					<MemberCard member={m} />
				{/each}
			</div>
		{/if}
	{:else}
		<p class="empty">Les membres de cette equipe seront bientot disponibles.</p>
	{/if}
</article>

<style>
	article {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
		width: 100%;
		box-sizing: border-box;
	}

	.back {
		display: inline-block;
		margin-bottom: 1.5rem;
		color: var(--color-text-light);
		font-weight: 500;
	}

	.back:hover {
		color: var(--color-primary);
	}

	.hero {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 1.75rem;
		background: #fff;
		border: 1px solid var(--color-bg-2);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-sm);
		border-top: 4px solid var(--accent);
	}

	.logos {
		display: flex;
		gap: 0.75rem;
		flex: none;
	}

	.parent {
		display: block;
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-secondary);
		margin-bottom: 0.3rem;
	}

	.hero h1 {
		margin: 0 0 0.6rem;
		font-size: 2rem;
		text-align: left;
		color: var(--color-primary);
	}

	.hero h1 .alt {
		color: var(--color-text-light);
		font-weight: 600;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.tag {
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		background: var(--color-bg-1);
		color: var(--color-primary);
	}

	.tag.promo {
		background: var(--color-secondary);
		color: var(--color-primary-dark);
	}

	.tag.muted {
		background: var(--color-bg-2);
		color: var(--color-text-light);
		font-weight: 500;
	}

	.contact {
		display: inline-block;
		margin-top: 0.6rem;
		color: var(--color-primary-light);
		font-size: 0.9rem;
	}

	.contact:hover {
		text-decoration: underline;
	}

	.description {
		margin: 2rem 0;
		padding: 1.5rem 1.75rem;
		background: #fff;
		border: 1px solid var(--color-bg-2);
		border-radius: var(--radius-lg);
		line-height: 1.7;
		color: var(--color-text);
	}

	.description :global(a) {
		color: var(--color-primary-light);
		text-decoration: underline;
	}

	h2 {
		margin: 2rem 0 1rem;
		font-size: 1.3rem;
		color: var(--color-primary);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		gap: 0.75rem;
	}

	.empty {
		margin-top: 2rem;
		padding: 2rem;
		text-align: center;
		background: var(--color-bg-1);
		border-radius: var(--radius-lg);
		color: var(--color-text-light);
	}

	@media (max-width: 640px) {
		.hero {
			flex-direction: column;
			text-align: center;
		}

		.hero h1 {
			text-align: center;
		}

		.tags {
			justify-content: center;
		}
	}
</style>
