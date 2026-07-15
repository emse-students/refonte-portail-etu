<script lang="ts">
	import type { CanariAssociationDetail } from "$lib/types";
	import AssociationLogo from "./AssociationLogo.svelte";
	import MemberCard from "./MemberCard.svelte";
	import GlassCard from "./GlassCard.svelte";
	import { sanitizeDescription } from "$lib/html";
	import { m } from "$lib/paraglide/messages";

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
	const bureau = $derived(entity.members.filter((member) => member.isAdmin));
	const others = $derived(entity.members.filter((member) => !member.isAdmin));
</script>

<article class="max-w-4xl mx-auto px-6 py-12 w-full box-border animate-fade-in">
	<a
		href={backHref}
		class="inline-flex items-center gap-2 text-mines-navy/60 dark:text-mines-platinum/60 hover:text-mines-navy dark:hover:text-mines-platinum mb-8 transition-colors font-medium"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
		>
		{backLabel}
	</a>

	<GlassCard
		class="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 md:p-8"
		style="border-top-color: {entity.color || '#1b263b'}; border-top-width: 4px;"
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
				<span
					class="block text-sm font-bold uppercase tracking-widest text-mines-gold dark:text-mines-gold mb-2"
					>{entity.parentName}</span
				>
			{/if}
			<h1
				class="m-0 mb-3 text-3xl md:text-4xl font-heading text-mines-navy dark:text-mines-platinum"
			>
				{entity.name}{#if entity.name2}<span
						class="text-mines-navy/60 dark:text-mines-platinum/60 font-semibold"
					>
						&amp; {entity.name2}</span
					>{/if}
			</h1>
			<div class="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
				{#if entity.type === "list" && entity.promo}
					<span
						class="px-3 py-1 rounded-full text-xs font-semibold bg-mines-gold text-mines-navy-dark dark:bg-mines-gold dark:text-mines-navy-dark"
						>{m.campaigns_year({ year: entity.promo })}</span
					>
				{/if}
				{#if entity.isBDE}
					<span
						class="px-3 py-1 rounded-full text-xs font-semibold bg-black/10 dark:bg-white/10 text-mines-navy dark:text-mines-platinum"
						>{m.badge_bde()}</span
					>
				{/if}
				{#if entity.archived}
					<span
						class="px-3 py-1 rounded-full text-xs font-medium bg-black/5 dark:bg-white/5 text-mines-navy/60 dark:text-mines-platinum/60"
						>{m.badge_archived()}</span
					>
				{/if}
				<span
					class="px-3 py-1 rounded-full text-xs font-medium bg-black/5 dark:bg-white/5 text-mines-navy/60 dark:text-mines-platinum/60"
					>{entity.members.length > 1
						? m.member_count_other({ count: entity.members.length })
						: m.member_count_one({ count: entity.members.length })}</span
				>
			</div>
			{#if entity.contactEmail}
				<a
					class="inline-block text-mines-gold dark:text-mines-gold hover:text-white hover:underline transition-colors mt-2"
					href="mailto:{entity.contactEmail}">{entity.contactEmail}</a
				>
			{/if}
		</div>
	</GlassCard>

	{#if description}
		<section
			class="my-8 p-6 md:p-8 bg-white/40 dark:bg-glass-100 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl text-mines-navy/90 dark:text-mines-platinum/90 leading-relaxed prose prose-slate dark:prose-invert max-w-none shadow-sm"
		>
			<!-- Sanitized upstream by sanitizeDescription(); safe to render as HTML. -->
			{@html description}
		</section>
	{/if}

	{#if entity.members.length > 0}
		{#if bureau.length > 0}
			<h2 class="mt-10 mb-6 text-2xl font-bold text-mines-navy dark:text-mines-platinum">
				{m.detail_board()}
			</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each bureau as member (member.id)}
					<MemberCard {member} bureau />
				{/each}
			</div>
		{/if}
		{#if others.length > 0}
			<h2 class="mt-10 mb-6 text-2xl font-bold text-mines-navy dark:text-mines-platinum">
				{m.detail_members()}
			</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each others as member (member.id)}
					<MemberCard {member} />
				{/each}
			</div>
		{/if}
	{:else}
		<p
			class="mt-8 p-8 text-center bg-black/5 dark:bg-white/5 rounded-2xl text-mines-navy/60 dark:text-mines-platinum/60 border border-black/5 dark:border-white/5"
		>
			{m.detail_coming_soon()}
		</p>
	{/if}
</article>
