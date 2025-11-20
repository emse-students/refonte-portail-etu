<script lang="ts">
	import type { Association } from "$lib/databasetypes";
	import AssociationCard from "$lib/components/AssociationCard.svelte";

	let { data } = $props();
	const associations: Association[] = data.associations || [];
	console.log("Associations loaded:", associations);

	let searchQuery = $state("");

	const filteredAssociations = $derived(
		associations.filter(association => 
			association.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			association.description?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>Nos Associations</title>
	<meta name="description" content="Découvrez la vie associative de notre campus." />
</svelte:head>

<div class="container">
	<header>
		<h1>La Vie Associative</h1>
		<p>
			Engagez-vous, développez de nouvelles compétences et rencontrez des étudiants partageant les
			mêmes passions.
		</p>

		<div class="search-container">
			<svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="11" cy="11" r="8"></circle>
				<path d="m21 21-4.35-4.35"></path>
			</svg>
			<input
				type="text"
				class="search-input"
				placeholder="Rechercher une association..."
				bind:value={searchQuery}
			/>
			{#if searchQuery}
				<button class="clear-btn" onclick={() => searchQuery = ""} aria-label="Effacer la recherche">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			{/if}
		</div>
	</header>

	{#if filteredAssociations.length > 0}
		<div class="grid">
			{#each filteredAssociations as association}
				<AssociationCard {association} />
			{/each}
		</div>
	{:else}
		<div class="no-results">
			<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="11" cy="11" r="8"></circle>
				<path d="m21 21-4.35-4.35"></path>
			</svg>
			<h2>Aucune association trouvée</h2>
			<p>Essayez avec d'autres mots-clés</p>
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 3rem 2rem;
		min-height: calc(100vh - 8rem);
	}

	header {
		text-align: center;
		margin-bottom: 4rem;
		padding: 2rem 0;
		animation: fadeInDown 0.6s ease-out;
	}

	@keyframes fadeInDown {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	header h1 {
		font-size: 3rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: #7c3aed;
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	header p {
		font-size: 1.2rem;
		color: #6b7280;
		max-width: 700px;
		margin: 0 auto 2rem auto;
		line-height: 1.6;
	}

	.search-container {
		position: relative;
		max-width: 600px;
		margin: 0 auto;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: #9ca3af;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.875rem 3rem 0.875rem 3rem;
		font-size: 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		outline: none;
		transition: all 0.2s ease;
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.search-input:focus {
		border-color: #7c3aed;
		box-shadow: 0 4px 16px rgba(124, 58, 237, 0.1);
	}

	.search-input::placeholder {
		color: #9ca3af;
	}

	.clear-btn {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: #f3f4f6;
		border: none;
		border-radius: 8px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: #6b7280;
		transition: all 0.2s ease;
	}

	.clear-btn:hover {
		background: #7c3aed;
		color: white;
	}

	.no-results {
		text-align: center;
		padding: 4rem 2rem;
		color: #9ca3af;
	}

	.no-results svg {
		margin: 0 auto 1.5rem auto;
		opacity: 0.5;
	}

	.no-results h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #4b5563;
		margin: 0 0 0.5rem 0;
	}

	.no-results p {
		font-size: 1rem;
		color: #9ca3af;
		margin: 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 2rem;
		animation: fadeIn 0.8s ease-out 0.2s backwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Stagger animation for cards */
	.grid :global(.association-card) {
		animation: slideUp 0.6s ease-out backwards;
	}

	.grid :global(.association-card:nth-child(1)) { animation-delay: 0.1s; }
	.grid :global(.association-card:nth-child(2)) { animation-delay: 0.15s; }
	.grid :global(.association-card:nth-child(3)) { animation-delay: 0.2s; }
	.grid :global(.association-card:nth-child(4)) { animation-delay: 0.25s; }
	.grid :global(.association-card:nth-child(5)) { animation-delay: 0.3s; }
	.grid :global(.association-card:nth-child(6)) { animation-delay: 0.35s; }
	.grid :global(.association-card:nth-child(n+7)) { animation-delay: 0.4s; }

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 1024px) {
		.container {
			padding: 2rem 1.5rem;
		}

		header h1 {
			font-size: 2.5rem;
		}

		.grid {
			grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
			gap: 1.5rem;
		}
	}

	@media (max-width: 768px) {
		.container {
			padding: 1.5rem 1rem;
		}

		header {
			margin-bottom: 2.5rem;
			padding: 1rem 0;
		}

		header h1 {
			font-size: 2rem;
		}

		header p {
			font-size: 1.05rem;
			margin-bottom: 1.5rem;
		}

		.search-input {
			font-size: 0.95rem;
			padding: 0.75rem 2.5rem 0.75rem 2.75rem;
		}

		.search-icon {
			left: 0.875rem;
			width: 18px;
			height: 18px;
		}

		.clear-btn {
			width: 28px;
			height: 28px;
		}

		.clear-btn svg {
			width: 16px;
			height: 16px;
		}

		.grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.no-results {
			padding: 3rem 1rem;
		}

		.no-results svg {
			width: 48px;
			height: 48px;
		}

		.no-results h2 {
			font-size: 1.25rem;
		}
	}
</style>