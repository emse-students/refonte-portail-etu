<script lang="ts">
	import type { Association } from "$lib/databasetypes";

	let { association }: { association: Association } = $props();

	import { resolve } from "$app/paths";
	import { of } from "$lib/utils";
	import ImageWithSkeleton from "./ImageWithSkeleton.svelte";

	// Function to get the full URL for the association logo
	function getLogoUrl(icon: number): string {
		return resolve("/api/image/") + icon;
	}
</script>

<div class="association-card">
	<a
		href={resolve(`/associations/${association.handle}`)}
		aria-label={`Voir les détails ${of(association.name)}${association.name}`}
	>
		{#if association.icon}
			<ImageWithSkeleton
				src={getLogoUrl(association.icon)}
				alt={`${association.name} logo`}
				class="association-logo"
			/>
		{:else}
			<div class="association-logo-placeholder">
				<span class="placeholder-text">{association.name.charAt(0).toUpperCase()}</span>
			</div>
		{/if}
		<div class="association-info">
			<h2 class="association-name">{association.name}</h2>
		</div>
	</a>
</div>

<style>
	.association-card {
		position: relative;
		border-radius: 16px;
		padding: 0;
		overflow: hidden;
		background: #ffffff;
		border: 1px solid #e5e7eb;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.association-card::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--color-secondary);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.3s ease;
	}

	.association-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
		border-color: var(--color-secondary);
	}

	.association-card:hover::before {
		transform: scaleX(1);
	}

	.association-card a {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
		height: 100%;
	}

	:global(.association-logo) {
		width: 200px;
		height: 200px;
		background: var(--bg-secondary);
		transition: transform 0.3s ease;
		box-sizing: border-box;
	}

	.association-logo-placeholder {
		width: 200px;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-primary-light);
		transition: transform 0.3s ease;
	}

	.placeholder-text {
		font-size: 5rem;
		font-weight: 700;
		color: white;
		user-select: none;
	}

	.association-card:hover :global(.association-logo),
	.association-card:hover .association-logo-placeholder {
		transform: scale(1.02);
	}

	.association-info {
		padding: 1.5rem;
		text-align: center;
		flex-grow: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.association-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
		line-height: 1.4;
		transition: color 0.2s ease;
	}

	.association-card:hover .association-name {
		color: var(--color-primary);
	}

	@media (max-width: 768px) {
		:global(.association-logo),
		.association-logo-placeholder {
			height: 160px;
		}

		.placeholder-text {
			font-size: 4rem;
		}

		.association-info {
			padding: 1rem;
		}

		.association-name {
			font-size: 1.1rem;
		}
	}
</style>
