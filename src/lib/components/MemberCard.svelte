<script lang="ts">
	import type { CanariMember } from "$lib/types";
	import { initials, generateColor, avatarUrl } from "$lib/media";

	let { member, bureau = false }: { member: CanariMember; bureau?: boolean } = $props();

	const name = $derived(
		member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ") || "Membre"
	);

	let showPhoto = $state(true);
</script>

<div
	class="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg {bureau
		? 'bg-glass-200 dark:bg-glass-200 border-mines-gold dark:border-mines-gold shadow-md'
		: 'bg-glass-100 dark:bg-glass-100 border-white/10 dark:border-white/10 hover:border-white/20 dark:hover:border-white/20'}"
>
	<div
		class="relative flex-none w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm select-none overflow-hidden"
		style="background:{generateColor(name)}"
	>
		<span>{initials(name)}</span>
		{#if showPhoto}
			<img
				src={avatarUrl(member.userId)}
				alt=""
				loading="lazy"
				class="absolute inset-0 w-full h-full object-cover"
				onerror={() => (showPhoto = false)}
			/>
		{/if}
	</div>
	<div class="min-w-0">
		<div
			class="font-semibold text-mines-navy dark:text-mines-platinum line-clamp-2 leading-tight"
			title={name}
		>
			{name}
		</div>
		<div class="flex items-center gap-1.5 text-xs text-mines-navy/70 dark:text-mines-platinum/70">
			<span class="font-medium text-mines-gold">{member.role}</span>
			{#if member.promo}
				<span class="before:content-['·'] before:mr-1.5">{member.promo}</span>
			{/if}
		</div>
	</div>
</div>
