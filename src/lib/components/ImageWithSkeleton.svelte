<script lang="ts">
	let {
		src,
		alt,
		class: className = "",
	} = $props<{
		src: string;
		alt: string;
		class?: string;
	}>();

	let loaded = $state(false);

	function handleLoad() {
		loaded = true;
	}
</script>

<div class="image-container {className}">
	{#if !loaded}
		<div class="skeleton"></div>
	{/if}
	<enhanced:img
		{src}
		{alt}
		class:hidden={!loaded}
		onload={handleLoad}
		onerror={handleLoad}
		loading="lazy"
	/>
</div>

<style>
	.image-container {
		position: relative;
		overflow: hidden;
		width: 100%;
		height: 100%;
	}

	enhanced\:img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: opacity 0.3s ease;
	}

	enhanced\:img.hidden {
		opacity: 0;
		position: absolute; /* Keep it in DOM to trigger load but hide it */
		top: 0;
		left: 0;
	}

	.skeleton {
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	/* Dark mode support for skeleton */
	:global([data-theme="dark"]) .skeleton {
		background: linear-gradient(90deg, #2d3748 25%, #4a5568 50%, #2d3748 75%);
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
