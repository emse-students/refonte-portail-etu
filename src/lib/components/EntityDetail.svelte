<script lang="ts">
	import type { CanariAssociationDetail } from "$lib/types";
	import AssociationLogo from "./AssociationLogo.svelte";
	import MemberCard from "./MemberCard.svelte";
	import GlassCard from "./GlassCard.svelte";
	import { sanitizeDescription } from "$lib/html";

	let {
		entity,
		backHref,
		backLabel,
	}: {
		entity: CanariAssociationDetail;
		backHref: string;
		backLabel: string;
	} = $props();

	const description = $derived(sanitizeDescription(entity.description));
	const bureau = $derived(entity.members.filter((m) => m.isAdmin));
	const others = $derived(entity.members.filter((m) => !m.isAdmin));
</script>

<article class="max-w-5xl mx-auto px-6 py-8 md:py-12 w-full box-border">
	<a
		class="inline-block mb-6 text-mines-platinum/70 font-medium hover:text-mines-gold transition-colors"
		href={backHref}
	>
		&larr; {backLabel}
	</a>

	<GlassCard
		class="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 md:p-8"
		style="border-top-color: {entity.color || 'var(--color-primary)'}; border-top-width: 4px;"
	>
		<div class="flex gap-3 flex-none">
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
		<div class="text-center sm:text-left flex-1 min-w-0">
			{#if entity.type === "list" && entity.parentName}
				<span class="block text-sm font-bold uppercase tracking-widest text-mines-gold mb-2"
					>{entity.parentName}</span
				>
			{/if}
			<h1 class="m-0 mb-3 text-3xl md:text-4xl font-heading text-mines-platinum">
				{entity.name}{#if entity.name2}<span class="text-mines-platinum/60 font-semibold">
						&amp; {entity.name2}</span
					>{/if}
			</h1>
			<div class="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
				{#if entity.type === "list" && entity.promo}
					<span
						class="px-3 py-1 rounded-full text-xs font-semibold bg-mines-gold text-mines-navy-dark"
						>Campagnes {entity.promo}</span
					>
				{/if}
				{#if entity.isBDE}
					<span class="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-mines-platinum"
						>BDE</span
					>
				{/if}
				{#if entity.archived}
					<span class="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-mines-platinum/60"
						>Archivee</span
					>
				{/if}
				<span class="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-mines-platinum/60"
					>{entity.members.length} membres</span
				>
			</div>
			{#if entity.contactEmail}
				<a
					class="inline-block text-mines-gold hover:text-white hover:underline transition-colors mt-2"
					href="mailto:{entity.contactEmail}">{entity.contactEmail}</a
				>
			{/if}
		</div>
	</GlassCard>

	{#if description}
		<section
			class="my-8 p-6 md:p-8 bg-glass-100 backdrop-blur-md border border-white/10 rounded-2xl text-mines-platinum/90 leading-relaxed prose prose-invert max-w-none"
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html description}
		</section>
	{/if}

	{#if entity.members.length > 0}
		{#if bureau.length > 0}
			<h2 class="mt-10 mb-6 text-2xl font-bold text-mines-platinum">Bureau</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{#each bureau as m (m.id)}
					<MemberCard member={m} bureau />
				{/each}
			</div>
		{/if}
		{#if others.length > 0}
			<h2 class="mt-10 mb-6 text-2xl font-bold text-mines-platinum">Membres</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{#each others as m (m.id)}
					<MemberCard member={m} />
				{/each}
			</div>
		{/if}
	{:else}
		<p
			class="mt-8 p-8 text-center bg-white/5 rounded-2xl text-mines-platinum/60 border border-white/5"
		>
			Les membres de cette equipe seront bientot disponibles.
		</p>
	{/if}
</article>
