<script lang="ts">
	import type { Association } from "$lib/databasetypes";
	import AssociationCard from "$lib/components/AssociationCard.svelte";

	let { data } = $props();
	const associations: Association[] = data.associations || [];
	console.log("Associations loaded:", associations);
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
	</header>

	<div class="grid">
		{#each associations as association}
			<AssociationCard {association} />
		{/each}
	</div>
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
		}

		.grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}
</style>