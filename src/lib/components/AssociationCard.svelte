<script lang="ts">
	import type { CanariAssociation } from "$lib/types";
	import AssociationLogo from "./AssociationLogo.svelte";

	let {
		association,
		base = "/associations",
	}: {
		association: CanariAssociation;
		/** Route prefix for the detail link ("/associations" or "/lists"). */
		base?: string;
	} = $props();

	const isList = $derived(association.type === "list");
</script>

<a class="card" href="{base}/{association.slug}">
	<AssociationLogo {association} size={72} />
	<div class="body">
		{#if isList && association.parentName}
			<span class="parent">{association.parentName}</span>
		{/if}
		<h3>{association.name}</h3>
		<div class="meta">
			{#if isList}
				{#if association.promo}
					<span class="promo">Campagnes {association.promo}</span>
				{/if}
			{:else if association.memberCount > 0}
				<span>{association.memberCount} membres</span>
			{/if}
			{#if association.archived}
				<span class="archived">Archivee</span>
			{/if}
		</div>
	</div>
</a>

<style>
	.card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #fff;
		border: 1px solid var(--color-bg-2);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			border-color 0.2s ease;
	}

	.card:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-md);
		border-color: var(--color-secondary);
	}

	.body {
		min-width: 0;
	}

	.parent {
		display: block;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-secondary);
		margin-bottom: 0.15rem;
	}

	h3 {
		margin: 0 0 0.25rem;
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.82rem;
		color: var(--color-text-light);
	}

	.promo {
		font-weight: 600;
		color: var(--color-primary);
	}

	.archived {
		padding: 0.05rem 0.4rem;
		border-radius: 999px;
		background: var(--color-bg-2);
		font-size: 0.75rem;
	}
</style>
