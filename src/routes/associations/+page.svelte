<script lang="ts">
	import type { Association } from "$lib/databasetypes";
	import AssociationCard from "$lib/components/AssociationCard.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import ImageUpload from "$lib/components/ImageUpload.svelte";
	import Permission, { hasPermission } from "$lib/permissions";
	import { invalidateAll } from "$app/navigation";
	import Search from "$lib/components/icons/Search.svelte";
	import X from "$lib/components/icons/X.svelte";
	import NoResults from "$lib/components/icons/NoResults.svelte";

	let { data } = $props();
	// svelte-ignore state_referenced_locally
	const associations: Association[] = data.associations || [];
	// svelte-ignore state_referenced_locally
	const userData = data.userData;
	console.log("Associations loaded:", associations);

	let searchQuery = $state("");
	let showCreateModal = $state(false);
	let newAssoName = $state("");
	let newAssoColor = $state(0);
	let newAssoIcon = $state<number | null>(null);
	let newAssoDescription = $state("");

	const canCreate = $derived(userData && hasPermission(userData.permissions, Permission.ADMIN));

	async function createAssociation() {
		const res = await fetch("/api/associations", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: newAssoName,
				color: newAssoColor,
				icon: newAssoIcon,
				description: newAssoDescription,
			}),
		});

		if (res.ok) {
			showCreateModal = false;
			newAssoName = "";
			newAssoColor = 0;
			newAssoIcon = null;
			newAssoDescription = "";
			invalidateAll();
		} else {
			alert("Erreur lors de la création de l'association");
		}
	}

	const filteredAssociations = $derived(
		associations.filter(
			(association) =>
				association.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				association.description?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const activeAssociations = $derived(filteredAssociations.filter((a) => !a.archived));
	const archivedAssociations = $derived(filteredAssociations.filter((a) => a.archived));
</script>

<svelte:head>
	<title>Associations</title>
	<meta name="description" content="Découvrez la vie associative de notre campus." />
</svelte:head>

<div class="container">
	<header>
		<h1>Vie associative</h1>
		<p>
			Engagez-vous, développez de nouvelles compétences et rencontrez des étudiants partageant les
			mêmes passions.
		</p>

		<div class="search-container">
			<Search class="search-icon" width="20" height="20" />
			<input
				type="text"
				class="search-input"
				placeholder="Rechercher une association..."
				bind:value={searchQuery}
			/>
			{#if searchQuery}
				<button
					class="clear-btn"
					onclick={() => (searchQuery = "")}
					aria-label="Effacer la recherche"
				>
					<X width="18" height="18" class="icon" />
				</button>
			{/if}
		</div>

		{#if canCreate}
			<button class="create-btn" onclick={() => (showCreateModal = true)}>
				+ Créer une association
			</button>
		{/if}
	</header>

	{#if activeAssociations.length > 0}
		<div class="grid">
			{#each activeAssociations as association}
				<AssociationCard {association} />
			{/each}
		</div>
	{/if}

	{#if archivedAssociations.length > 0}
		{#if activeAssociations.length > 0}
			<h2 class="section-title">Archives</h2>
		{/if}
		<div class="grid archived">
			{#each archivedAssociations as association}
				<AssociationCard {association} />
			{/each}
		</div>
	{/if}

	{#if activeAssociations.length === 0 && archivedAssociations.length === 0}
		<div class="no-results">
			<NoResults width="64" height="64" stroke-width="1.5" class="icon" />
			<h2>Aucune association trouvée</h2>
			<p>Essayez avec d'autres mots-clés</p>
		</div>
	{/if}

	<Modal bind:open={showCreateModal} title="Créer une association">
		<div class="form-group">
			<label for="new-asso-name">Nom de l'association</label>
			<input type="text" id="new-asso-name" bind:value={newAssoName} placeholder="Ex: BDE" />
		</div>
		<div class="form-group">
			<label for="new-asso-color">Couleur (Hex)</label>
			<input
				type="number"
				id="new-asso-color"
				bind:value={newAssoColor}
				placeholder="Ex: 0xFF0000"
			/>
		</div>
		<div class="form-group">
			<label for="new-asso-icon">Logo</label>
			<ImageUpload currentImageId={newAssoIcon} onImageUploaded={(id) => (newAssoIcon = id)} />
		</div>
		<div class="form-group">
			<label for="new-asso-desc">Description (Markdown supporté)</label>
			<textarea
				id="new-asso-desc"
				bind:value={newAssoDescription}
				rows="5"
				placeholder="Description de l'association..."
			></textarea>
		</div>
		<div class="modal-actions">
			<button class="cancel-btn" onclick={() => (showCreateModal = false)}>Annuler</button>
			<button class="primary-btn" onclick={createAssociation}>Créer</button>
		</div>
	</Modal>
</div>

<style>
	.create-btn {
		margin-top: 2rem;
		padding: 0.75rem 1.5rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.create-btn:hover {
		background: var(--color-primary-dark);
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 3rem 0 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-bg-2);
	}

	.grid.archived {
		opacity: 0.7;
		filter: grayscale(100%);
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--color-text);
		font-weight: 500;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-bg-2);
		border-radius: 8px;
		font-size: 1rem;
		box-sizing: border-box;
		background: var(--bg-secondary);
		color: var(--color-text);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
	}

	.cancel-btn {
		padding: 0.75rem 1.5rem;
		background: var(--color-bg-2);
		color: var(--color-text);
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}

	.primary-btn {
		padding: 0.75rem 1.5rem;
		background: var(--color-primary);
		color: var(--color-text-on-primary);
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}

	.primary-btn:hover {
		background: var(--color-primary-dark);
	}

	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 3rem 2rem;
		min-height: calc(100vh - 8rem);
		width: inherit;
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

	.search-container {
		position: relative;
		max-width: 600px;
		margin: 0 auto;
	}

	:global(.search-icon) {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-text-light);
		pointer-events: none;
		z-index: 1;
	}

	.search-input {
		width: 100%;
		padding: 0.875rem 3rem 0.875rem 3rem;
		font-size: 1rem;
		border: 2px solid var(--color-bg-2);
		border-radius: 12px;
		outline: none;
		transition: all 0.2s ease;
		background: white;
		box-shadow: var(--shadow-sm);
	}

	.search-input:focus {
		border-color: var(--color-primary);
		box-shadow: var(--shadow-md);
	}

	.search-input::placeholder {
		color: var(--color-text-light);
	}

	.clear-btn {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: var(--color-bg-2);
		border: none;
		border-radius: 8px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--color-text-light);
		transition: all 0.2s ease;
	}

	.clear-btn:hover {
		background: var(--color-primary);
		color: white;
	}

	.no-results {
		text-align: center;
		padding: 4rem 2rem;
		color: var(--color-text-light);
	}

	.no-results h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.no-results p {
		font-size: 1rem;
		color: var(--color-text-light);
		margin: 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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

	.grid :global(.association-card:nth-child(1)) {
		animation-delay: 0.1s;
	}
	.grid :global(.association-card:nth-child(2)) {
		animation-delay: 0.15s;
	}
	.grid :global(.association-card:nth-child(3)) {
		animation-delay: 0.2s;
	}
	.grid :global(.association-card:nth-child(4)) {
		animation-delay: 0.25s;
	}
	.grid :global(.association-card:nth-child(5)) {
		animation-delay: 0.3s;
	}
	.grid :global(.association-card:nth-child(6)) {
		animation-delay: 0.35s;
	}
	.grid :global(.association-card:nth-child(n + 7)) {
		animation-delay: 0.4s;
	}

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

		.clear-btn {
			width: 28px;
			height: 28px;
		}

		.grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem;
		}

		.no-results {
			padding: 3rem 1rem;
		}

		.no-results h2 {
			font-size: 1.25rem;
		}
	}
</style>
