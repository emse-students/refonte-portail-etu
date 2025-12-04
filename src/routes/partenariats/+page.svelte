<script lang="ts">
	import { onMount } from "svelte";

	import partners from "$lib/data/partenariats.json";
	import { of } from "$lib/utils";

	let partnerLogos: { name: string; logoUrl: string }[] = [];

	onMount(() => {
		partnerLogos = partners.map((partner) => ({
			...partner,
			logoUrl: `https://placehold.co/200x100/EEE/31343C?text=${encodeURIComponent(partner.name)}`,
		}));
	});
</script>

<svelte:head>
	<title>Nos Partenariats</title>
	<meta
		name="description"
		content="Découvrez les partenaires qui collaborent avec nous et les avantages exclusifs pour nos membres."
	/>
</svelte:head>

<div class="container">
	<header>
		<h1>Nos Partenariats</h1>
		<p>
			Nous sommes fiers de collaborer avec un réseau d'entreprises et d'organisations engagées.
			Découvrez les avantages exclusifs qu'ils proposent à notre communauté.
		</p>
	</header>

	<main class="partners-grid">
		{#if partnerLogos.length > 0}
			{#each partnerLogos as partner (partner.name)}
				<div class="partner-card">
					<div class="logo-container">
						<enhanced:img
							src={partner.logoUrl}
							alt={`Logo ${of(partner.name)}${partner.name}`}
							loading="lazy"
						/>
					</div>
					<div class="card-content">
						<h3>{partner.name}</h3>
					</div>
				</div>
			{/each}
		{:else}
			{#each Array(8) as _}
				<div class="partner-card skeleton"></div>
			{/each}
		{/if}
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

	h1 {
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

	.partners-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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

	.partner-card {
		background: var(--bg-secondary);
		border-radius: 16px;
		border: 1px solid var(--color-bg-1);
		box-shadow: var(--shadow-md);
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.partner-card::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.3s ease;
	}

	.partner-card:hover {
		transform: translateY(-8px);
		box-shadow: var(--shadow-lg);
		border-color: var(--color-primary);
	}

	.partner-card:hover::before {
		transform: scaleX(1);
	}

	.logo-container {
		background: var(--color-bg-1);
		display: flex;
		align-items: center;
		justify-content: center;
		height: 140px;
		transition: transform 0.3s ease;
	}

	.partner-card:hover .logo-container {
		transform: scale(1.02);
	}

	.logo-container enhanced\:img {
		max-width: 80%;
		max-height: 80%;
		object-fit: contain;
	}

	.card-content {
		padding: 1.5rem;
		border-top: 1px solid var(--color-bg-1);
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: var(--color-text);
		transition: color 0.2s ease;
	}

	.partner-card:hover h3 {
		color: var(--color-primary);
	}

	.skeleton {
		height: 240px;
		background: linear-gradient(
			90deg,
			var(--color-bg-1) 25%,
			var(--color-bg-2) 50%,
			var(--color-bg-1) 75%
		);
		background-size: 200% 100%;
		animation: skeleton-loading 1.5s infinite linear;
	}

	@keyframes skeleton-loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (max-width: 1024px) {
		.container {
			padding: 2rem 1.5rem;
		}

		h1 {
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

		h1 {
			font-size: 2rem;
		}

		header p {
			font-size: 1.05rem;
		}

		.partners-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.logo-container {
			height: 120px;
		}
	}
</style>
