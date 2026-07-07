<script lang="ts">
	import type { CanariAssociation } from "$lib/types";
	import AssociationLogo from "./AssociationLogo.svelte";
	import GlassCard from "./GlassCard.svelte";

	let {
		association,
		base = "/associations",
	}: {
		association: CanariAssociation;
		base?: string;
	} = $props();

	const isList = $derived(association.type === "list");
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
			class="m-0 mb-1 text-lg font-semibold text-mines-navy dark:text-mines-platinum truncate transition-colors group-hover:text-mines-navy/80 dark:group-hover:text-white"
		>
			{association.name}
		</h3>
		<div
			class="flex flex-wrap items-center gap-2 text-sm text-mines-navy/70 dark:text-mines-platinum/70"
		>
			{#if isList}
				{#if association.promo}
					<span class="font-semibold text-mines-gold">Campagnes {association.promo}</span>
				{/if}
			{:else if association.memberCount > 0}
				<span>{association.memberCount} membres</span>
			{/if}
			{#if association.archived}
				<span class="px-2 py-0.5 rounded-full bg-white/10 text-xs">Archivee</span>
			{/if}
		</div>
	</div>
</GlassCard>
