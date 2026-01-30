<script lang="ts">
	import type { List } from "$lib/databasetypes";

	interface ListWithAssociation extends List {
		association_name?: string;
	}

	let { list }: { list: ListWithAssociation } = $props();

	import { resolve } from "$app/paths";
	import { of } from "$lib/utils";
	import ImageWithSkeleton from "./ImageWithSkeleton.svelte";

	// Function to get the full URL for the list logo
	function getLogoUrl(icon: number): string {
		return resolve("/api/image/") + icon;
	}
</script>

<div class="list-card">
	<a
		href={resolve(`/lists/${list.handle}`)}
		aria-label={`Voir les détails ${of(list.name)}${list.name}`}
	>
		{#if list.icon}
			<ImageWithSkeleton src={getLogoUrl(list.icon)} alt={`${list.name} logo`} class="list-logo" />
		{:else}
			<div class="list-logo-placeholder">
				<span class="placeholder-text">{list.name.charAt(0).toUpperCase()}</span>
			</div>
		{/if}
		<div class="list-info">
			<h2 class="list-name">{list.name}</h2>
			{#if list.association_name}
				<p class="association-name">{list.association_name}</p>
			{/if}
		</div>
	</a>
</div>

<style>
	.list-card {
		position: relative;
		border-radius: 16px;
		padding: 0;
		overflow: hidden;
		background: var(--bg-secondary);
		border: 1px solid var(--color-bg-1);
		box-shadow: var(--shadow-md);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.list-card::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--color-primary);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.3s ease;
	}

	.list-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
		border-color: var(--color-primary);
	}

	.list-card:hover::before {
		transform: scaleX(1);
	}

	.list-card a {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
		height: 100%;
	}

	:global(.list-logo) {
		width: 200px;
		height: 200px;
		object-fit: cover;
		background: var(--bg-secondary);
		transition: transform 0.3s ease;
		box-sizing: border-box;
	}

	.list-logo-placeholder {
		width: 200px;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-primary);
		transition: transform 0.3s ease;
	}

	.placeholder-text {
		font-size: 5rem;
		font-weight: 700;
		color: var(--color-text-on-primary);
		user-select: none;
	}

	.list-card:hover :global(.list-logo),
	.list-card:hover .list-logo-placeholder {
		transform: scale(1.02);
	}

	.list-info {
		padding: 1.5rem;
		text-align: center;
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.list-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
		line-height: 1.4;
		transition: color 0.2s ease;
	}

	.association-name {
		font-size: 0.9rem;
		color: var(--color-text-light);
		margin: 0;
		font-weight: 500;
	}

	.list-card:hover .list-name {
		color: var(--color-primary);
	}

	@media (max-width: 768px) {
		:global(.list-logo),
		.list-logo-placeholder {
			height: 160px;
		}

		.placeholder-text {
			font-size: 4rem;
		}

		.list-info {
			padding: 1rem;
		}

		.list-name {
			font-size: 1.1rem;
		}

		.association-name {
			font-size: 0.85rem;
		}
	}
</style>
