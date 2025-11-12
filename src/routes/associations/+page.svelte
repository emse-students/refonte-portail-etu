<script lang="ts">
	import type { Association } from "$lib/databasetypes";
	import { resolve } from "bun";

	let { associations }: {associations: Association[]} = $props();
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
			<a class="card" href={resolve(`/associations/${association.handle}`)}>
				<img src={association.icon} alt={`Logo de ${association.name}`} class="logo" />
				<div class="card-content">
					<h2>{association.name}</h2>
					<p>{association.description}</p>
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	header {
		text-align: center;
		margin-bottom: 3rem;
	}

	header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	header p {
		font-size: 1.1rem;
		color: #666;
		max-width: 600px;
		margin: 0 auto;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
	}

	.card {
		background-color: #fff;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
	}

	.card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
	}

	.logo {
		width: 100%;
		height: 180px;
		object-fit: cover;
		background-color: #f0f0f0;
	}

	.card-content {
		padding: 1.5rem;
		flex-grow: 1;
	}

	.card-content h2 {
		font-size: 1.5rem;
		margin-top: 0;
		margin-bottom: 0.75rem;
	}

	.card-content p {
		font-size: 1rem;
		color: #555;
		line-height: 1.6;
	}
</style>