<script lang="ts">
	import type { Association } from "$lib/databasetypes";
	import SvelteMarkdown from "svelte-markdown";

	let { data } = $props();
	const association: Association = data.association;
</script>

<svelte:head>
	<title>{association.name}</title>
	<meta
		name="description"
		content="Découvrez la vie associative de notre campus."
	/>
</svelte:head>
<div class="container">
	<header class="page-header">
		<h1>{association.name}</h1>
	</header>
	
	<div class="content-wrapper">
		{#if association.description}
			<section class="description-section">
				<div class="description-content">
					<SvelteMarkdown source={association.description} />
				</div>
			</section>
		{/if}

		{#if association.members && association.members.length > 0}
			<section class="members-section">
				<h2>Membres de l'association</h2>
				<div class="members-grid">
					{#each association.members as member}
						<div class="member-card">
							<div class="member-name">
								{member.user.first_name} {member.user.last_name}
							</div>
							<div class="member-role">{member.role.name}</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<section class="events-section">
			<h2>Événements à venir</h2>
			<p class="empty-state">Aucun événement prévu pour le moment</p>
		</section>
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 2rem;
		min-height: calc(100vh - 8rem);
	}

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
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

	.page-header h1 {
		font-size: 3rem;
		font-weight: 700;
		margin: 0;
		background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		letter-spacing: -0.02em;
	}

	.content-wrapper {
		display: flex;
		flex-direction: column;
		gap: 3rem;
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

	section {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
	}

	h2 {
		font-size: 1.75rem;
		font-weight: 600;
		color: #7c3aed;
		margin: 0 0 1.5rem 0;
	}

	.description-content {
		font-size: 1.05rem;
		color: #4a5568;
		line-height: 1.7;
	}

	.description-content :global(p) {
		margin-bottom: 1rem;
	}

	.description-content :global(h1),
	.description-content :global(h2),
	.description-content :global(h3) {
		color: #2d3748;
		margin: 1.5rem 0 0.75rem 0;
	}

	.members-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.25rem;
	}

	.member-card {
		background: linear-gradient(135deg, #f8f9fa 0%, #f3f4f6 100%);
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.25rem;
		transition: all 0.2s ease;
	}

	.member-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
		border-color: #c4b5fd;
	}

	.member-name {
		font-size: 1.05rem;
		font-weight: 600;
		color: #1a202c;
		margin-bottom: 0.5rem;
	}

	.member-role {
		font-size: 0.9rem;
		color: #7c3aed;
		font-weight: 500;
	}

	.empty-state {
		color: #718096;
		font-style: italic;
		text-align: center;
		padding: 2rem;
	}

	@media (max-width: 1024px) {
		.container {
			padding: 2rem 1.5rem;
		}

		.page-header h1 {
			font-size: 2.5rem;
		}

		.members-grid {
			grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		}
	}

	@media (max-width: 768px) {
		.container {
			padding: 1.5rem 1rem;
		}

		.page-header {
			margin-bottom: 2rem;
			padding: 1rem 0;
		}

		.page-header h1 {
			font-size: 2rem;
		}

		.content-wrapper {
			gap: 2rem;
		}

		section {
			padding: 1.5rem;
		}

		h2 {
			font-size: 1.5rem;
			margin-bottom: 1.25rem;
		}

		.members-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
