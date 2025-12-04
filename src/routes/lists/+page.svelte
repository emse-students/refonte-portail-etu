<script lang="ts">
	import type { List } from "$lib/databasetypes";
	import ListCard from "$lib/components/ListCard.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import ImageUpload from "$lib/components/ImageUpload.svelte";
	import Permission, { hasPermission } from "$lib/permissions";
	import { invalidateAll } from "$app/navigation";
	import ChevronDown from "$lib/components/icons/ChevronDown.svelte";

	interface ListWithAssociation extends List {
		association_name?: string;
	}

	let { data } = $props();
	const lists: ListWithAssociation[] = data.lists || [];
	const userData = data.userData;
	console.log("Lists loaded:", lists);

	let showCreateModal = $state(false);
	let newListName = $state("");
	let newListHandle = $state("");
	let newListColor = $state(0);
	let newListIcon = $state<number | null>(null);
	let newListDescription = $state("");
	let newListPromo = $state(new Date().getFullYear());

	const canCreate = $derived(userData && hasPermission(userData.permissions, Permission.ADMIN));

	async function createList() {
		const res = await fetch("/api/lists", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: newListName,
				handle: newListHandle,
				color: newListColor,
				icon: newListIcon,
				description: newListDescription,
				promo: newListPromo,
				association_id: null, // TODO: Add association selection if needed
			}),
		});

		if (res.ok) {
			showCreateModal = false;
			newListName = "";
			newListHandle = "";
			newListColor = 0;
			newListIcon = null;
			newListDescription = "";
			invalidateAll();
		} else {
			alert("Erreur lors de la création de la liste");
		}
	}

	// Grouper les listes par promotion
	const listsByPromo = lists.reduce(
		(acc, list) => {
			const promo = list.promo || 0;
			if (!acc[promo]) {
				acc[promo] = [];
			}
			acc[promo].push(list);
			return acc;
		},
		{} as Record<number, ListWithAssociation[]>
	);

	// Trier chaque groupe par nom d'association
	Object.values(listsByPromo).forEach((promoLists) => {
		promoLists.sort((a, b) => {
			const nameA = a.association_name || "";
			const nameB = b.association_name || "";
			return nameA.localeCompare(nameB);
		});
	});

	// Convertir en tableau et trier par promotion (plus récent d'abord)
	const promoSections = Object.entries(listsByPromo)
		.map(([promo, lists]) => ({ promo: Number(promo), lists }))
		.sort((a, b) => b.promo - a.promo);

	// État pour gérer les sections ouvertes/fermées
	let openPromos = $state<Set<number>>(new Set(promoSections.map((s) => s.promo)));

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
		{#if canCreate}
			<button class="create-btn" onclick={() => (showCreateModal = true)}>
				+ Créer une liste
			</button>
		{/if}
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
					<ChevronDown width="24" height="24" class="icon" />
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

	<Modal bind:open={showCreateModal} title="Créer une liste">
		<div class="form-group">
			<label for="new-list-name">Nom de la liste</label>
			<input type="text" id="new-list-name" bind:value={newListName} placeholder="Ex: BDE 2024" />
		</div>
		<div class="form-group">
			<label for="new-list-handle">Handle (URL)</label>
			<input
				type="text"
				id="new-list-handle"
				bind:value={newListHandle}
				placeholder="Ex: bde-2024"
			/>
		</div>
		<div class="form-group">
			<label for="new-list-promo">Promotion</label>
			<input type="number" id="new-list-promo" bind:value={newListPromo} placeholder="2024" />
		</div>
		<div class="form-group">
			<label for="new-list-color">Couleur (Hex)</label>
			<input
				type="number"
				id="new-list-color"
				bind:value={newListColor}
				placeholder="Ex: 0xFF0000"
			/>
		</div>
		<div class="form-group">
			<label for="new-list-icon">Logo</label>
			<ImageUpload currentImageId={newListIcon} onImageUploaded={(id) => (newListIcon = id)} />
		</div>
		<div class="form-group">
			<label for="new-list-desc">Description (Markdown supporté)</label>
			<textarea
				id="new-list-desc"
				bind:value={newListDescription}
				rows="5"
				placeholder="Description de la liste..."
			></textarea>
		</div>
		<div class="modal-actions">
			<button class="cancel-btn" onclick={() => (showCreateModal = false)}>Annuler</button>
			<button class="primary-btn" onclick={createList}>Créer</button>
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
		color: white;
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
		background: var(--color-primary);
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: var(--shadow-md);
		margin-bottom: 1.5rem;
	}

	.promo-header:hover {
		background: var(--color-primary-dark);
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.promo-header h2 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text-on-primary);
	}

	.toggle-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-on-primary);
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

	.grid :global(.list-card:nth-child(1)) {
		animation-delay: 0.1s;
	}
	.grid :global(.list-card:nth-child(2)) {
		animation-delay: 0.15s;
	}
	.grid :global(.list-card:nth-child(3)) {
		animation-delay: 0.2s;
	}
	.grid :global(.list-card:nth-child(4)) {
		animation-delay: 0.25s;
	}
	.grid :global(.list-card:nth-child(5)) {
		animation-delay: 0.3s;
	}
	.grid :global(.list-card:nth-child(6)) {
		animation-delay: 0.35s;
	}
	.grid :global(.list-card:nth-child(n + 7)) {
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
