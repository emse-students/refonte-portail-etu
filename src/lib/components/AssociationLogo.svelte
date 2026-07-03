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
	class="logo"
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
			onerror={() => (failed = true)}
		/>
	{:else}
		<span style="font-size:{size * 0.36}px">{initials(association.name)}</span>
	{/if}
</div>

<style>
	.logo {
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: var(--color-bg-2);
	}

	.logo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.logo span {
		font-weight: 700;
		color: #fff;
		user-select: none;
		line-height: 1;
	}
</style>
