<script lang="ts">
	import { asset } from "$app/paths";

	//import sites from json file
	import sites from "$lib/data/autres-sites.json";
</script>

<svelte:head>
	<title>Autres Sites</title>
	<meta
		name="description"
		content="Découvrez d'autres sites utiles pour les étudiants de notre campus."
	/>
</svelte:head>

<div class="container">
	<header>
		<h1>Autres Sites Utiles</h1>
		<p>
			Explorez une sélection de sites web qui offrent des ressources et des informations utiles pour
			les étudiants de notre campus.
		</p>
	</header>

	<main class="sites-grid">
		{#each sites as site}
			<a href={site.url} class="site-card" target="_blank" rel="noopener noreferrer">
				<img src={asset(site.icon)} alt={`${site.name} logo`} class="site-icon" />
				<div class="card-content">
					<h3>{site.name}</h3>
					<p>{site.description}</p>
				</div>
			</a>
		{/each}
	</main>
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
		color: var(--color-primary);
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	header p {
		font-size: 1.2rem;
		color: var(--color-text-light);
		max-width: 700px;
		margin: 0 auto;
		line-height: 1.6;
	}

	.sites-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 2rem;
		padding-bottom: 3rem;
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

	.site-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1.5rem;
		background: var(--bg-secondary);
		border-radius: 16px;
		border: 1px solid var(--color-bg-1);
		box-shadow: var(--shadow-md);
		text-decoration: none;
		color: inherit;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		min-height: 240px;
	}

	.site-card::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%);
		transform: scaleX(0);
		transition: transform 0.3s ease;
	}

	.site-card:hover {
		transform: translateY(-8px);
		box-shadow: var(--shadow-lg);
		border-color: var(--color-primary);
	}

	.site-card:hover::before {
		transform: scaleX(1);
	}

	.site-icon {
		width: 80px;
		height: 80px;
		object-fit: contain;
		margin-bottom: 1.25rem;
		border-radius: 12px;
		padding: 0.5rem;
		background: var(--bg-secondary);
		box-shadow: var(--shadow-sm);
		transition: transform 0.3s ease;
	}

	.site-card:hover .site-icon {
		transform: scale(1.1);
	}

	.card-content {
		text-align: center;
		width: 100%;
	}

	.card-content h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		transition: color 0.2s ease;
	}

	.site-card:hover .card-content h3 {
		color: var(--color-primary);
	}

	.card-content p {
		margin: 0;
		color: var(--color-text-light);
		font-size: 0.95rem;
		line-height: 1.5;
	}

	@media (max-width: 1024px) {
		.container {
			padding: 2rem 1.5rem;
		}

		header h1 {
			font-size: 2.5rem;
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

		.sites-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.site-card {
			min-height: 220px;
			padding: 1.5rem 1rem;
		}

		.site-icon {
			width: 64px;
			height: 64px;
		}
	}
</style>
