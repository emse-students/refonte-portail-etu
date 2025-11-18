<script lang="ts">
	import type { List } from "$lib/databasetypes";
	import ListCard from "$lib/components/ListCard.svelte";

	interface ListWithAssociation extends List {
		association_name?: string;
	}

	let { data } = $props();
	const lists: ListWithAssociation[] = data.lists || [];
	console.log("Lists loaded:", lists);

	// Grouper les listes par promotion
	const listsByPromo = lists.reduce((acc, list) => {
		const promo = list.promo || 0;
		if (!acc[promo]) {
			acc[promo] = [];
		}
		acc[promo].push(list);
		return acc;
	}, {} as Record<number, ListWithAssociation[]>);

	// Trier chaque groupe par nom d'association
	Object.values(listsByPromo).forEach(promoLists => {
		promoLists.sort((a, b) => {
			const nameA = a.association_name || '';
			const nameB = b.association_name || '';
			return nameA.localeCompare(nameB);
		});
	});

	// Convertir en tableau et trier par promotion (plus récent d'abord)
	const promoSections = Object.entries(listsByPromo)
		.map(([promo, lists]) => ({ promo: Number(promo), lists }))
		.sort((a, b) => b.promo - a.promo);

	// État pour gérer les sections ouvertes/fermées
	let openPromos = $state<Set<number>>(new Set(promoSections.map(s => s.promo)));

	function togglePromo(promo: number) {
		if (openPromos.has(promo)) {
			openPromos.delete(promo);
		} else {
			openPromos.add(promo);
		}
		openPromos = new Set(openPromos);
	}
</script>

<svelte:head>
	<title>Listes et Anciennes listes</title>
	<meta name="description" content="Découvrez la vie associative de notre campus." />
</svelte:head>

<div class="container">
	<header>
		<h1>La Vie Associative</h1>
		<p>
			Engagez-vous, développez de nouvelles compétences et rencontrez des étudiants partageant les
			mêmes passions.
		</p>
	</header>

	{#each promoSections as { promo, lists }}
		<section class="promo-section">
			<button 
				class="promo-header" 
				onclick={() => togglePromo(promo)}
				aria-expanded={openPromos.has(promo)}
			>
				<h2>Promotion {promo}</h2>
				<span class="toggle-icon" class:open={openPromos.has(promo)}>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</span>
			</button>
			
			{#if openPromos.has(promo)}
				<div class="grid">
					{#each lists as list}
						<ListCard {list} />
					{/each}
				</div>
			{/if}
		</section>
	{/each}
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
		background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	header p {
		font-size: 1.2rem;
		color: #6b7280;
		max-width: 700px;
		margin: 0 auto;
		line-height: 1.6;
	}

	.promo-section {
		margin-bottom: 3rem;
		animation: fadeIn 0.8s ease-out backwards;
	}

	.promo-header {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem 2rem;
		background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
		margin-bottom: 1.5rem;
	}

	.promo-header:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3);
	}

	.promo-header h2 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: white;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.toggle-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		transition: transform 0.3s ease;
	}

	.toggle-icon.open {
		transform: rotate(180deg);
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
	.grid :global(.list-card) {
		animation: slideUp 0.6s ease-out backwards;
	}

	.grid :global(.list-card:nth-child(1)) { animation-delay: 0.1s; }
	.grid :global(.list-card:nth-child(2)) { animation-delay: 0.15s; }
	.grid :global(.list-card:nth-child(3)) { animation-delay: 0.2s; }
	.grid :global(.list-card:nth-child(4)) { animation-delay: 0.25s; }
	.grid :global(.list-card:nth-child(5)) { animation-delay: 0.3s; }
	.grid :global(.list-card:nth-child(6)) { animation-delay: 0.35s; }
	.grid :global(.list-card:nth-child(n+7)) { animation-delay: 0.4s; }

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

		.promo-header {
			padding: 1.25rem 1.5rem;
		}

		.promo-header h2 {
			font-size: 1.5rem;
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
		}

		.promo-section {
			margin-bottom: 2rem;
		}

		.promo-header {
			padding: 1rem 1.25rem;
			margin-bottom: 1rem;
		}

		.promo-header h2 {
			font-size: 1.25rem;
		}

		.grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}
</style>