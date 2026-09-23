<script lang="ts">
	import type { CanariAssociationDetail } from "$lib/types";
	import AssociationLogo from "./AssociationLogo.svelte";
	import MemberCard from "./MemberCard.svelte";
	import GlassCard from "./GlassCard.svelte";
	import ProfileBioMarkdown from "./ProfileBioMarkdown.svelte";
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

	const hasBio = $derived(
		Boolean(entity.description?.trim()) || Boolean(entity.bioMarkdown?.trim())
	);
	const bureau = $derived(entity.members.filter((member) => member.isAdmin));
	const others = $derived(entity.members.filter((member) => !member.isAdmin));

	/**
	 * A LIST'S SECOND THEME - the campaign identity it runs beside its public one.
	 *
	 * Either half may exist without the other (renamed before the second logo is uploaded, or the
	 * reverse), so the block is drawn when EITHER is present. Requiring BOTH, as this page used to,
	 * dropped a second logo whose name had not been filled in and a second name whose logo had not
	 * been uploaded - and the `<h1>` disagreed with the logo row about it, testing only `name2`.
	 * Canari's own `AssociationDetailView` and `AssociationTile` take the same decision.
	 */
	const secondName = $derived(entity.type === "list" ? (entity.name2?.trim() ?? "") : "");
	const secondLogoId = $derived(entity.type === "list" ? (entity.logoMediaId2?.trim() ?? "") : "");
	const hasSecondTheme = $derived(Boolean(secondName) || Boolean(secondLogoId));
	/** The second theme as a logo subject; its initials fall back to the main name when unnamed. */
	const secondTheme = $derived({
		name: secondName || entity.name,
		logoMediaId: secondLogoId || null,
		logoUrl: null,
		color: entity.color,
	});
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
		<AssociationLogo association={entity} size={104} rounded="24%" />
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
				{entity.name}
			</h1>
			<!--
				THE SECOND LOGO SITS WITH THE SECOND NAME (user, 2026-09-23). Both logos shared one
				104px row while both names shared the `<h1>`, so the reader had to cross the two
				pairings over to match a theme to its mark. The second theme is now one subordinate
				row - its own logo beside its own name - which is what Canari draws too.

				It also fixes the name being glued to the ampersand. `<span>\n\t&amp; {name2}</span>`
				put the separating space at the START of an element's content, which Svelte trims,
				so production rendered `Mines'tagnard& Mines'diana Jones`. No shape here carries a
				space in markup any more: `gap-*` does it, and a compiler cannot trim that.
			-->
			{#if hasSecondTheme}
				<div class="flex items-center justify-center sm:justify-start gap-3 mb-3">
					<AssociationLogo association={secondTheme} size={44} rounded="24%" />
					{#if secondName}
						<span
							class="min-w-0 text-xl md:text-2xl font-heading font-semibold text-mines-navy/60 dark:text-mines-platinum/60 [overflow-wrap:anywhere]"
							>{secondName}</span
						>
					{/if}
				</div>
			{/if}
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

	{#if hasBio}
		<section
			class="my-8 p-6 md:p-8 bg-white/40 dark:bg-glass-100 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl text-mines-navy/90 dark:text-mines-platinum/90 leading-relaxed shadow-xs"
		>
			{#if entity.description?.trim()}
				<ProfileBioMarkdown
					source={entity.description}
					class="text-lg md:text-xl font-medium text-mines-navy dark:text-mines-platinum"
				/>
			{/if}
			{#if entity.bioMarkdown?.trim()}
				{#if entity.description?.trim()}
					<hr class="my-6 border-t border-black/10 dark:border-white/10" />
				{/if}
				<ProfileBioMarkdown source={entity.bioMarkdown} class="text-sm md:text-base" />
			{/if}
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
