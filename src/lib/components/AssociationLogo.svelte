<script lang="ts">
	import type { CanariAssociation } from "$lib/types";
	import { logoUrl, initials, generateColor } from "$lib/media";

	let {
		association,
		size = 64,
		rounded = "18%",
	}: {
		association: Pick<CanariAssociation, "name" | "logoMediaId" | "logoUrl" | "color">;
		/** Rendered square size in pixels. */
		size?: number;
		/** border-radius value (e.g. "50%" for a circle). */
		rounded?: string;
	} = $props();

	const url = $derived(logoUrl(association));
	let failed = $state(false);
	const showImage = $derived(!!url && !failed);
	const bg = $derived(association.color || generateColor(association.name));
</script>

<div
	class="flex-none flex items-center justify-center overflow-hidden bg-mines-navy/10 dark:bg-white/10"
	style="width:{size}px;height:{size}px;border-radius:{rounded};{showImage
		? ''
		: `background:${bg}`}"
>
	{#if showImage}
		<img
			src={url}
			alt={association.name}
			loading="lazy"
			decoding="async"
			class="w-full h-full object-cover"
			onerror={() => (failed = true)}
		/>
	{:else}
		<span class="font-bold text-white leading-none select-none" style="font-size:{size * 0.36}px"
			>{initials(association.name)}</span
		>
	{/if}
</div>
