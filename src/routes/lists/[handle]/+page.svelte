<script lang="ts">
	import type { Member, RawUser } from "$lib/databasetypes";
	import SvelteMarkdown from "svelte-markdown";
	import MemberCard from "$lib/components/MemberCard.svelte";
	import EventCard from "$lib/components/EventCard.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import Permission, { hasPermission } from "$lib/permissions";
	import { invalidateAll } from "$app/navigation";
	import { of } from "$lib/utils.js";

	import ImageUpload from "$lib/components/ImageUpload.svelte";

	let { data } = $props();
	const list = $derived(data.list);
	const events = $derived(data.events || []);
	const userData = $derived(data.userData);
	const isAdmin = $derived(hasPermission(userData?.permissions || 0, Permission.ADMIN));

	let editMode = $state(false);
	let showAddMemberModal = $state(false);
	let showEditMemberModal = $state(false);
	let showDeleteConfirmModal = $state(false);
	let selectedMember: Member | null = $state(null);
	let memberToDelete: Member | null = $state(null);

	// Member editing/creation fields
	let memberRoleName = $state("");
	let memberHierarchy = $state(0);
	let memberPermissions = $state(0);

	// For adding member
	let searchQuery = $state("");
	let searchResults: RawUser[] = $state([]);
	let selectedUserToAdd: RawUser | null = $state(null);

	const maxPermissionLevel = $derived.by(() => {
		if (!userData) return 0;
		if (userData.admin) return Permission.ADMIN;
		if (hasPermission(userData.permissions, Permission.ADMIN)) return Permission.ADMIN;
		const membership = userData.memberships.find((m) => m.list_id === list.id);
		return membership ? membership.permissions : 0;
	});

	const availablePermissions = $derived(
		[
			{ value: Permission.MEMBER, label: "Membre (0)" },
			{ value: Permission.MANAGE, label: "Gestion Membres & Événements (1)" },
			{ value: Permission.ADMIN, label: "Administration (2)" },
		].filter((p) => p.value <= maxPermissionLevel)
	);

	const canEdit = $derived.by(() => {
		if (!userData) return false;
		if (hasPermission(userData.permissions, Permission.ADMIN)) return true;

		// Check if user is a member of this list with MANAGE permission
		const listMembership = userData.memberships.find((m) => m.list_id === list.id);
		if (listMembership && hasPermission(listMembership.permissions, Permission.MANAGE)) return true;

		// Also check if user is admin of the parent association
		const assocMembership = userData.memberships.find((m) => m.list_id === list.id);
		if (assocMembership && hasPermission(assocMembership.permissions, Permission.MANAGE))
			return true;

		return false;
	});

	const canEditDetails = $derived.by(() => {
		if (!userData) return false;
		if (hasPermission(userData.permissions, Permission.ADMIN)) return true;
		const membership = userData.memberships.find((m) => m.list_id === list.id);
		if (!membership) return false;
		return hasPermission(membership.permissions, Permission.ADMIN);
	});

	const adminButtonText = $derived.by(() => {
		if (editMode) return "Terminer l'édition";
		if (canEditDetails) return "Administration";
		return "Gérer les membres";
	});

	function requestRemoveMember(id: number) {
		const member = list.members.find((m) => m.id === id);
		if (member) {
			memberToDelete = member;
			showDeleteConfirmModal = true;
		}
	}

	let showEditListModal = $state(false);
	let editListName = $state("");
	let editListDescription = $state("");
	let editListHandle = $state("");
	let editListPromo = $state(0);
	let editListColor = $state(0);
	let editListIcon = $state<number | null>(null);

	function openEditListModal() {
		editListName = list.name;
		editListDescription = list.description;
		editListHandle = list.handle;
		editListColor = list.color;
		editListPromo = list.promo;
		editListIcon = list.icon || null;
		showEditListModal = true;
	}

	async function updateList() {
		const res = await fetch(`/api/lists/${list.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: editListName,
				description: editListDescription,
				handle: editListHandle,
				color: editListColor,
				icon: editListIcon,
				promo: editListPromo,
			}),
		});

		if (res.ok) {
			showEditListModal = false;
			await invalidateAll();
		} else {
			alert("Erreur lors de la modification de l'list");
		}
	}

	async function confirmRemoveMember() {
		if (!memberToDelete) return;
		const res = await fetch("/api/members", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: memberToDelete.id }),
		});
		if (res.ok) {
			showDeleteConfirmModal = false;
			memberToDelete = null;
			await invalidateAll();
		} else {
			alert("Erreur lors de la suppression du membre");
		}
	}

	function openEditMemberModal(member: Member) {
		selectedMember = member;
		memberRoleName = member.role_name;
		memberHierarchy = member.hierarchy;
		memberPermissions = member.permissions;
		showEditMemberModal = true;
	}

	async function updateMember() {
		if (!selectedMember) return;
		const res = await fetch("/api/members", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id: selectedMember.id,
				user_id: selectedMember.user.id,
				association_id: null,
				list_id: list.id,
				role_name: memberRoleName,
				hierarchy: memberHierarchy,
				permissions: memberPermissions,
				visible: selectedMember.visible,
			}),
		});
		if (res.ok) {
			showEditMemberModal = false;
			const member = list.members.find((m) => m.id === selectedMember!.id);
			if (member) {
				member.role_name = memberRoleName;
				member.hierarchy = memberHierarchy;
				member.permissions = memberPermissions;
			}
			await invalidateAll();
		} else {
			alert("Erreur lors de la modification du membre");
		}
	}

	async function searchUsers() {
		if (searchQuery.length < 2) {
			searchResults = [];
			return;
		}
		const res = await fetch("/api/users");
		const users: RawUser[] = await res.json();
		searchResults = users
			.filter(
				(u) =>
					u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					u.login.toLowerCase().includes(searchQuery.toLowerCase())
			)
			.slice(0, 10);
	}

	async function addMember() {
		if (!selectedUserToAdd) return;
		const res = await fetch("/api/members", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				user_id: selectedUserToAdd.id,
				association_id: null,
				list_id: list.id,
				role_name: memberRoleName,
				hierarchy: memberHierarchy,
				permissions: memberPermissions,
				visible: true,
			}),
		});
		if (res.ok) {
			showAddMemberModal = false;
			selectedUserToAdd = null;
			searchQuery = "";
			searchResults = [];
			await invalidateAll();
		} else {
			alert("Erreur lors de l'ajout du membre");
		}
	}

	// Séparer le bureau (hierarchy >= 6) des autres membres
	const bureauMembers = $derived(
		list.members?.filter((m) => m.hierarchy >= 6).sort((a, b) => b.hierarchy - a.hierarchy) || []
	);
	const otherMembers = $derived(
		list.members?.filter((m) => m.hierarchy < 6).sort((a, b) => b.hierarchy - a.hierarchy) || []
	);
</script>

<svelte:head>
	<title>{list.name}</title>
	<meta name="description" content="Découvrez la vie associative de notre campus." />
</svelte:head>
<div class="container">
	<header class="page-header">
		<h1>{list.name}</h1>
		{#if list.association}
			<p class="subtitle">
				Liste
				<a href="/associations/{list.association.handle}" class="association-link">
					{list.association.name}
				</a>
				{list.promo > 0 ? `- Promo ${list.promo}` : ""}
			</p>
		{/if}
		{#if canEdit}
			<div class="header-actions">
				<button class="action-btn" onclick={() => (editMode = !editMode)}>
					{adminButtonText}
				</button>
				{#if editMode && canEditDetails}
					<button class="action-btn secondary" onclick={openEditListModal}>
						Éditer les informations
					</button>
				{/if}
			</div>
		{/if}
	</header>

	<div class="content-wrapper">
		{#if list.description}
			<section class="description-section">
				<div class="description-content">
					<SvelteMarkdown source={list.description} />
				</div>
			</section>
		{/if}

		{#if editMode}
			<div class="admin-actions">
				<button
					class="add-member-btn"
					onclick={() => {
						showAddMemberModal = true;
						memberRoleName = "";
						memberHierarchy = 0;
						memberPermissions = 0;
					}}
				>
					+ Ajouter un membre
				</button>
			</div>
		{/if}

		{#if bureauMembers.length > 0}
			<section class="members-section bureau-section">
				<h2>Bureau</h2>
				<div class="members-grid bureau-grid">
					{#each bureauMembers as member}
						{#if member.visible || isAdmin}
							<MemberCard
								{member}
								isBureau={true}
								{editMode}
								onRemove={requestRemoveMember}
								onEditMember={openEditMemberModal}
								hidden={!member.visible}
							/>
						{/if}
					{/each}
				</div>
			</section>
		{/if}

		{#if otherMembers.length > 0}
			<section class="members-section">
				<h2>Membres</h2>
				<div class="members-grid">
					{#each otherMembers as member}
						{#if member.visible || isAdmin}
							<MemberCard
								{member}
								{editMode}
								onRemove={requestRemoveMember}
								onEditMember={openEditMemberModal}
								hidden={!member.visible}
							/>
						{/if}
					{/each}
				</div>
			</section>
		{/if}

		<section class="events-section">
			<h2>Événements à venir</h2>
			{#if events.length === 0}
				<p class="empty-state">Aucun événement à venir pour cette liste.</p>
			{:else}
				<div class="events-list">
					{#each events as event}
						<EventCard {event} />
					{/each}
				</div>
			{/if}
		</section>
	</div>

	<Modal bind:open={showAddMemberModal} title="Ajouter un membre">
		<div class="form-group">
			<label for="search-user">Rechercher un utilisateur</label>
			<input
				id="search-user"
				type="text"
				bind:value={searchQuery}
				oninput={searchUsers}
				placeholder="Nom, prénom ou login..."
				autocomplete="off"
			/>
			{#if searchResults.length > 0}
				<div class="search-results">
					{#each searchResults as user}
						<button
							class="search-result-item"
							onclick={() => {
								selectedUserToAdd = user;
								searchResults = [];
								searchQuery = `${user.first_name} ${user.last_name}`;
							}}
						>
							{user.first_name}
							{user.last_name} ({user.login})
						</button>
					{/each}
				</div>
			{/if}
		</div>
		{#if selectedUserToAdd}
			<div class="form-group">
				<label for="member-role-add">Nom du rôle</label>
				<input
					id="member-role-add"
					type="text"
					bind:value={memberRoleName}
					placeholder="Ex: Président, Membre..."
				/>
			</div>
			<div class="form-group">
				<label for="member-hierarchy-add">Hiérarchie (0-10)</label>
				<input
					id="member-hierarchy-add"
					type="number"
					bind:value={memberHierarchy}
					min="0"
					max="10"
					placeholder="0"
				/>
				<small style="color: #718096; font-size: 0.85rem; margin-top: 0.25rem; display: block;">
					{#if memberHierarchy >= 6}
						<strong style="color: var(--color-primary);"
							>Ce membre sera affiché dans le Bureau.</strong
						>
					{:else}
						Ce membre sera affiché dans la liste des membres standards.
					{/if}
				</small>
			</div>
			<div class="form-group">
				<label for="member-permissions-add">Permissions</label>
				<select id="member-permissions-add" bind:value={memberPermissions}>
					{#each availablePermissions as perm}
						<option value={perm.value}>{perm.label}</option>
					{/each}
				</select>
			</div>
			<div class="modal-actions">
				<button class="cancel-btn" onclick={() => (showAddMemberModal = false)}>Annuler</button>
				<button class="primary-btn" onclick={addMember}>Ajouter</button>
			</div>
		{/if}
	</Modal>

	<Modal
		bind:open={showEditMemberModal}
		title={selectedMember
			? `Modifier ${of(selectedMember.user.first_name)}${selectedMember.user.first_name}`
			: "Modifier le membre"}
	>
		{#if selectedMember}
			<div class="form-group">
				<label for="member-role-edit">Nom du rôle</label>
				<input
					id="member-role-edit"
					type="text"
					bind:value={memberRoleName}
					placeholder="Ex: Président, Membre..."
				/>
			</div>
			<div class="form-group">
				<label for="member-hierarchy-edit">Hiérarchie (0-10)</label>
				<input
					id="member-hierarchy-edit"
					type="number"
					bind:value={memberHierarchy}
					min="0"
					max="10"
					placeholder="0"
				/>
				<small style="color: #718096; font-size: 0.85rem; margin-top: 0.25rem; display: block;">
					{#if memberHierarchy >= 6}
						<strong style="color: var(--color-primary);"
							>Ce membre sera affiché dans le Bureau.</strong
						>
					{:else}
						Ce membre sera affiché dans la liste des membres standards.
					{/if}
				</small>
			</div>
			<div class="form-group">
				<label for="member-permissions-edit">Permissions</label>
				<select id="member-permissions-edit" bind:value={memberPermissions}>
					{#each availablePermissions as perm}
						<option value={perm.value}>{perm.label}</option>
					{/each}
				</select>
			</div>
			<div class="modal-actions">
				<button class="cancel-btn" onclick={() => (showEditMemberModal = false)}>Annuler</button>
				<button class="primary-btn" onclick={updateMember}>Enregistrer</button>
			</div>
		{/if}
	</Modal>

	<Modal bind:open={showEditListModal} title="Modifier la liste">
		<div class="form-group">
			<label for="list-name">Nom de la liste</label>
			<input type="text" id="list-name" bind:value={editListName} />
		</div>
		<div class="form-group">
			<label for="list-handle">Handle (URL)</label>
			<input type="text" id="list-handle" bind:value={editListHandle} />
		</div>
		<div class="form-group">
			<label for="list-promo">Campagnes</label>
			<input type="number" id="list-promo" bind:value={editListPromo} />
		</div>
		<div class="form-group">
			<label for="list-color">Couleur (Hex)</label>
			<input type="number" id="list-color" bind:value={editListColor} />
		</div>
		<div class="form-group">
			<label for="list-icon">Logo</label>
			<ImageUpload
				currentImageId={editListIcon}
				onImageUploaded={(id) => (editListIcon = id)}
				listId={list.id}
			/>
		</div>
		<div class="form-group">
			<label for="list-desc">Description (Markdown supporté)</label>
			<textarea
				id="list-desc"
				bind:value={editListDescription}
				rows="10"
				style="width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; box-sizing: border-box; resize: vertical;"
			></textarea>
		</div>
		<div class="modal-actions">
			<button class="cancel-btn" onclick={() => (showEditListModal = false)}>Annuler</button>
			<button class="primary-btn" onclick={updateList}>Enregistrer</button>
		</div>
	</Modal>

	<Modal bind:open={showDeleteConfirmModal} title="Confirmer la suppression">
		{#if memberToDelete}
			<p>
				Êtes-vous sûr de vouloir retirer <strong
					>{memberToDelete.user.first_name} {memberToDelete.user.last_name}</strong
				> de la liste ?
			</p>
			<div class="modal-actions">
				<button class="cancel-btn" onclick={() => (showDeleteConfirmModal = false)}>Annuler</button>
				<button class="remove-btn" onclick={confirmRemoveMember}>Confirmer</button>
			</div>
		{/if}
	</Modal>
</div>

<style>
	/* ... existing styles ... */
	.action-btn {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.action-btn:hover {
		background: var(--color-primary-dark);
	}

	.action-btn.secondary {
		background: var(--color-text-light);
	}

	.action-btn.secondary:hover {
		background: var(--color-primary-dark);
	}

	.header-actions {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	.admin-actions {
		display: flex;
		justify-content: flex-end;
	}

	.add-member-btn {
		padding: 0.75rem 1.5rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.add-member-btn:hover {
		background: #059669;
	}

	.form-group {
		margin-bottom: 1.5rem;
		position: relative;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--color-text-light);
		font-weight: 500;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-bg-2);
		border-radius: 8px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.search-results {
		position: absolute;
		top: 100%;
		left: 0;
		width: 100%;
		background: white;
		border: 1px solid var(--color-bg-2);
		border-radius: 8px;
		max-height: 200px;
		overflow-y: auto;
		z-index: 10;
		box-shadow: var(--shadow-md);
	}

	.search-result-item {
		width: 100%;
		text-align: left;
		padding: 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		transition: background 0.1s;
	}

	.search-result-item:hover {
		background: var(--color-bg-2);
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
		color: var(--color-text-light);
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

	.remove-btn {
		padding: 0.75rem 1.5rem;
		background: #fee2e2;
		color: #c53030;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}

	.remove-btn:hover {
		background: #fecaca;
	}

	.container {
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
		padding: 3rem 2rem;
		min-height: calc(100vh - 8rem);
		box-sizing: border-box;
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
		margin: 0 0 0.5rem 0;
		color: var(--color-primary);
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 1.25rem;
		color: var(--color-text-light);
		margin: 0;
	}

	.association-link {
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s ease;
		border-bottom: 2px solid transparent;
	}

	.association-link:hover {
		color: var(--color-primary-dark);
		border-bottom-color: var(--color-primary);
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
		width: 100%;
		background: white;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: var(--shadow-md);
		box-sizing: border-box;
	}

	h2 {
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--color-primary);
		margin: 0 0 1.5rem 0;
	}

	.description-content {
		font-size: 1.05rem;
		color: var(--color-text-light);
		line-height: 1.7;
	}

	.description-content :global(p) {
		margin-bottom: 1rem;
	}

	.description-content :global(h1),
	.description-content :global(h2),
	.description-content :global(h3) {
		color: var(--color-text);
		margin: 1.5rem 0 0.75rem 0;
	}

	.members-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.25rem;
	}

	.bureau-section {
		background: linear-gradient(135deg, var(--color-bg-2) 0%, var(--color-bg-1) 100%);
		border: 2px solid var(--color-primary);
	}

	.bureau-grid {
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	}

	.events-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.25rem;
	}

	.empty-state {
		color: var(--color-text-light);
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
			grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		}

		.bureau-grid {
			grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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

		.members-grid,
		.bureau-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.events-list {
			grid-template-columns: 1fr;
		}
	}
</style>
