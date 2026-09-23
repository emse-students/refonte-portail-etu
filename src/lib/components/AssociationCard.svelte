<script lang="ts">
	import type { CanariAssociation } from "$lib/types";
	import AssociationLogo from "./AssociationLogo.svelte";
	import GlassCard from "./GlassCard.svelte";
	import { m } from "$lib/paraglide/messages";

	let {
		association,
		base = "/associations",
	}: {
		association: CanariAssociation;
		base?: string;
	} = $props();

	const isList = $derived(association.type === "list");

	/**
	 * A LIST'S SECOND THEME, small, under the main name - the same subordinate row `EntityDetail`
	 * and Canari's own tile draw. Either half may exist without the other, so the row appears when
	 * EITHER is present and the logo falls back to the main name for its initials.
	 */
	const secondName = $derived(isList ? (association.name2?.trim() ?? "") : "");
	const secondLogoId = $derived(isList ? (association.logoMediaId2?.trim() ?? "") : "");
	const hasSecondTheme = $derived(Boolean(secondName) || Boolean(secondLogoId));
	const secondTheme = $derived({
		name: secondName || association.name,
		logoMediaId: secondLogoId || null,
		logoUrl: null,
		color: association.color,
	});
</script>

<GlassCard href="{base}/{association.slug}" class="flex items-center gap-4 p-4 group">
	<AssociationLogo {association} size={72} />
	<div class="min-w-0 flex-1">
		{#if isList && association.parentName}
			<span class="block text-xs font-bold uppercase tracking-wider text-mines-gold mb-1"
				>{association.parentName}</span
			>
		{/if}
		<h3
			class="m-0 mb-1 text-lg font-semibold text-mines-navy dark:text-mines-platinum line-clamp-2 leading-tight transition-colors group-hover:text-mines-navy/80 dark:group-hover:text-white"
			title={association.name}
		>
			{association.name}
		</h3>
		{#if hasSecondTheme}
			<div class="flex items-center gap-2 mb-1">
				<AssociationLogo association={secondTheme} size={24} />
				{#if secondName}
					<span
						class="min-w-0 text-sm font-semibold text-mines-navy/60 dark:text-mines-platinum/60 line-clamp-1"
						>{secondName}</span
					>
				{/if}
			</div>
		{/if}
		<div
			class="flex flex-wrap items-center gap-2 text-sm text-mines-navy/70 dark:text-mines-platinum/70"
		>
			{#if isList}
				{#if association.promo}
					<span class="font-semibold text-mines-gold"
						>{m.campaigns_year({ year: association.promo })}</span
					>
				{/if}
			{:else if association.memberCount > 0}
				<span
					>{association.memberCount > 1
						? m.member_count_other({ count: association.memberCount })
						: m.member_count_one({ count: association.memberCount })}</span
				>
			{/if}
			{#if association.archived}
				<span class="px-2 py-0.5 rounded-full bg-white/10 text-xs">{m.badge_archived()}</span>
			{/if}
		</div>
	</div>
</GlassCard>
