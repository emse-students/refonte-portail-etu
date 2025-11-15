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
        margin-bottom: 1rem;
        background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
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
</style>