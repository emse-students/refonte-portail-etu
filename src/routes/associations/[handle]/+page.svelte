<script lang="ts">
	import type { Member, RawUser, Role } from "$lib/databasetypes";
	import SvelteMarkdown from "svelte-markdown";
	import MemberCard from "$lib/components/MemberCard.svelte";
	import EventCard from "$lib/components/EventCard.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import Permission, { hasPermission } from "$lib/permissions";
	import { invalidateAll } from "$app/navigation";
	import { of } from "$lib/utils.js";

	let { data } = $props();
	const association = $derived(data.association);
	const events = $derived(data.events || []);
	const roles = $derived(data.roles || []);
	const userData = $derived(data.userData);

	let editMode = $state(false);
	let showAddMemberModal = $state(false);
	let showEditRoleModal = $state(false);
	let showDeleteConfirmModal = $state(false);
	let selectedMember: Member | null = $state(null);
	let memberToDelete: Member | null = $state(null);
	let selectedRole = $state<number | "new">();

	// Role search
	let roleSearchQuery = $state("");
	let showRoleResults = $state(false);
	const filteredRoles = $derived(
		roles.filter((r: Role) => r.name.toLowerCase().includes(roleSearchQuery.toLowerCase()))
	);

	function selectRole(role: Role, context: "add" | "edit") {
		if (context === "add") {
			newMemberRoleId = role.id;
		} else {
			selectedRole = role.id;
		}
		roleSearchQuery = role.name;
		showRoleResults = false;
	}

	function handleCreateRoleClick(context: "add" | "edit") {
		createRoleContext = context;
		newRoleName = roleSearchQuery; // Pre-fill with search query
		newRoleHierarchy = 0;
		newRolePermissions = 0;
		showCreateRoleModal = true;
		showRoleResults = false;
	}

	// For adding member
	let searchQuery = $state("");
	let searchResults: RawUser[] = $state([]);
	let selectedUserToAdd: RawUser | null = $state(null);
	let newMemberRoleId = $state<number | "new">();

	$effect(() => {
		if (roles.length > 0 && !newMemberRoleId) {
			newMemberRoleId = roles[0].id;
		}
	});

	// Role creation
	let showCreateRoleModal = $state(false);
	let newRoleName = $state("");
	let newRoleHierarchy = $state(0);
	let newRolePermissions = $state(0);
	let createRoleContext: "add" | "edit" | null = $state(null);

	const maxPermissionLevel = $derived.by(() => {
		if (!userData) return 0;
		if (hasPermission(userData.permissions, Permission.ADMIN)) return Permission.SITE_ADMIN;
		const membership = userData.memberships.find((m) => m.association_id === association.id);
		return membership ? membership.role.permissions : 0;
	});

	const availablePermissions = $derived(
		[
			{ value: Permission.MEMBER, label: "Membre (0)" },
			{ value: Permission.ROLES, label: "Gestion Rôles & Membres (1)" },
			{ value: Permission.EVENTS, label: "Gestion Événements (2)" },
			{ value: Permission.ADMIN, label: "Administration (3)" },
		].filter((p) => p.value <= maxPermissionLevel)
	);

	const canEdit = $derived.by(() => {
		if (!userData) return false;
		if (hasPermission(userData.permissions, Permission.ADMIN)) return true;
		// Check if user is a member of this association with ROLES permission
		const membership = userData.memberships.find((m) => m.association_id === association.id);
		if (!membership) return false;
		return hasPermission(membership.role.permissions, Permission.ROLES);
	});

	const canEditDetails = $derived.by(() => {
		if (!userData) return false;
		if (hasPermission(userData.permissions, Permission.ADMIN)) return true;
		const membership = userData.memberships.find((m) => m.association_id === association.id);
		if (!membership) return false;
		return hasPermission(membership.role.permissions, Permission.ADMIN);
	});

	const adminButtonText = $derived.by(() => {
		if (editMode) return "Terminer l'édition";
		if (canEditDetails) return "Administration";
		return "Gérer les membres";
	});

	let showEditAssociationModal = $state(false);
	let editAssociationName = $state("");
	let editAssociationDescription = $state("");

	function openEditAssociationModal() {
		editAssociationName = association.name;
		editAssociationDescription = association.description;
		showEditAssociationModal = true;
	}

	async function updateAssociation() {
		const res = await fetch(`/api/associations/${association.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: editAssociationName,
				description: editAssociationDescription,
			}),
		});

		if (res.ok) {
			showEditAssociationModal = false;
			invalidateAll();
		} else {
			alert("Erreur lors de la modification de l'association");
		}
	}

	function requestRemoveMember(id: number) {
		const member = association.members.find((m) => m.id === id);
		if (member) {
			memberToDelete = member;
			showDeleteConfirmModal = true;
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
			invalidateAll();
		} else {
			alert("Erreur lors de la suppression du membre");
		}
	}

	function openEditRoleModal(member: Member) {
		selectedMember = member;
		selectedRole = member.role.id;
		roleSearchQuery = member.role.name;
		showRoleResults = false;
		showEditRoleModal = true;
	}

	async function updateMemberRole() {
		if (!selectedMember) return;
		const res = await fetch("/api/members", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id: selectedMember.id,
				user_id: selectedMember.user.id,
				association_id: association.id,
				list_id: null,
				role_id: selectedRole,
				visible: selectedMember.visible,
			}),
		});
		if (res.ok) {
			showEditRoleModal = false;
			invalidateAll();
		} else {
			alert("Erreur lors de la modification du rôle");
		}
	}

	async function searchUsers() {
		if (searchQuery.length < 2) {
			searchResults = [];
			return;
		}
		// Fetch all users and filter client-side for now (as per API limitation)
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
		if (newMemberRoleId === "new") return; // Should not happen if UI is correct

		const res = await fetch("/api/members", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				user_id: selectedUserToAdd.id,
				association_id: association.id,
				list_id: null,
				role_id: newMemberRoleId,
				visible: true,
			}),
		});
		if (res.ok) {
			showAddMemberModal = false;
			selectedUserToAdd = null;
			searchQuery = "";
			searchResults = [];
			invalidateAll();
		} else {
			alert("Erreur lors de l'ajout du membre");
		}
	}

	async function createRole() {
		const res = await fetch("/api/roles", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: newRoleName,
				hierarchy: newRoleHierarchy,
				permissions: newRolePermissions,
				association_id: association.id,
				list_id: null,
			}),
		});

		if (res.ok) {
			const data = await res.json();
			showCreateRoleModal = false;
			// Invalidate to refresh roles list
			await invalidateAll();
			// Select the new role
			if (createRoleContext === "add") {
				newMemberRoleId = data.id;
			} else if (createRoleContext === "edit") {
				selectedRole = data.id;
			}
			roleSearchQuery = newRoleName;
		} else {
			const err = await res.json();
			alert(err.message || "Erreur lors de la création du rôle");
		}
	}

	// Séparer le bureau (hierarchy >= 6) des autres membres
	const bureauMembers = $derived(
		association.members
			?.filter((m) => m.role.hierarchy >= 6)
			.sort((a, b) => b.role.hierarchy - a.role.hierarchy) || []
	);
	const otherMembers = $derived(
		association.members
			?.filter((m) => m.role.hierarchy < 6)
			.sort((a, b) => b.role.hierarchy - a.role.hierarchy) || []
	);
</script>

<svelte:head>
	<title>{association.name}</title>
	<meta name="description" content="Découvrez la vie associative de notre campus." />
</svelte:head>
<div class="container">
	<header class="page-header">
		<h1>{association.name}</h1>
		{#if canEdit}
			<div class="header-actions">
				<button class="action-btn" onclick={() => (editMode = !editMode)}>
					{adminButtonText}
				</button>
				{#if editMode && canEditDetails}
					<button class="action-btn secondary" onclick={openEditAssociationModal}>
						Éditer les informations
					</button>
				{/if}
			</div>
		{/if}
	</header>

	<div class="content-wrapper">
		{#if association.description}
			<section class="description-section">
				<div class="description-content">
					<SvelteMarkdown source={association.description} />
				</div>
			</section>
		{/if}

		{#if editMode}
			<div class="admin-actions">
				<button
					class="add-member-btn"
					onclick={() => {
						showAddMemberModal = true;
						roleSearchQuery = "";
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
						<MemberCard
							{member}
							isBureau={true}
							{editMode}
							onRemove={requestRemoveMember}
							onEditRole={openEditRoleModal}
						/>
					{/each}
				</div>
			</section>
		{/if}

		{#if otherMembers.length > 0}
			<section class="members-section">
				<h2>Membres</h2>
				<div class="members-grid">
					{#each otherMembers as member}
						<MemberCard
							{member}
							{editMode}
							onRemove={requestRemoveMember}
							onEditRole={openEditRoleModal}
						/>
					{/each}
				</div>
			</section>
		{/if}

		<section class="events-section">
			<h2>Événements à venir</h2>
			{#if events.length === 0}
				<p class="empty-state">Aucun événement à venir pour cette association.</p>
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
				<label for="role-search-add">Rôle</label>
				<input
					id="role-search-add"
					type="text"
					bind:value={roleSearchQuery}
					placeholder="Rechercher ou créer un rôle..."
					onfocus={() => (showRoleResults = true)}
					autocomplete="off"
				/>
				{#if showRoleResults && roleSearchQuery}
					<div class="search-results">
						{#each filteredRoles as role}
							<button class="search-result-item" onclick={() => selectRole(role, "add")}>
								{role.name}
							</button>
						{/each}
						<button
							class="search-result-item create-role-item"
							onclick={() => handleCreateRoleClick("add")}
						>
							+ Créer un nouveau rôle...
						</button>
					</div>
				{/if}
			</div>
			<div class="modal-actions">
				<button class="cancel-btn" onclick={() => (showAddMemberModal = false)}>Annuler</button>
				<button class="primary-btn" onclick={addMember}>Ajouter</button>
			</div>
		{/if}
	</Modal>

	<Modal
		bind:open={showEditRoleModal}
		title={selectedMember
			? `Modifier le rôle ${of(selectedMember.user.first_name)}${selectedMember.user.first_name}`
			: "Modifier le rôle"}
	>
		{#if selectedMember}
			<div class="form-group">
				<label for="role-search-edit">Rôle</label>
				<input
					id="role-search-edit"
					type="text"
					bind:value={roleSearchQuery}
					placeholder="Rechercher ou créer un rôle..."
					onfocus={() => (showRoleResults = true)}
					autocomplete="off"
				/>
				{#if showRoleResults && roleSearchQuery}
					<div class="search-results">
						{#each filteredRoles as role}
							<button class="search-result-item" onclick={() => selectRole(role, "edit")}>
								{role.name}
							</button>
						{/each}
						<button
							class="search-result-item create-role-item"
							onclick={() => handleCreateRoleClick("edit")}
						>
							+ Créer un nouveau rôle...
						</button>
					</div>
				{/if}
			</div>
			<div class="modal-actions">
				<button class="cancel-btn" onclick={() => (showEditRoleModal = false)}>Annuler</button>
				<button class="primary-btn" onclick={updateMemberRole}>Enregistrer</button>
			</div>
		{/if}
	</Modal>

	<Modal bind:open={showCreateRoleModal} title="Créer un nouveau rôle">
		<div class="form-group">
			<label for="new-role-name">Nom du rôle</label>
			<input type="text" id="new-role-name" bind:value={newRoleName} placeholder="Ex: Trésorier" />
		</div>
		<div class="form-group">
			<label for="new-role-hierarchy">Hiérarchie (0-10)</label>
			<input
				type="number"
				id="new-role-hierarchy"
				bind:value={newRoleHierarchy}
				min="0"
				max="10"
				placeholder="0"
			/>
			<small style="color: #718096; font-size: 0.85rem; margin-top: 0.25rem; display: block;"
				>Utilisé pour le tri (6+ = Bureau)</small
			>
		</div>
		<div class="form-group">
			<label for="new-role-permissions">Permissions</label>
			<select id="new-role-permissions" bind:value={newRolePermissions}>
				{#each availablePermissions as perm}
					<option value={perm.value}>{perm.label}</option>
				{/each}
			</select>
		</div>
		<div class="modal-actions">
			<button
				class="cancel-btn"
				onclick={() => {
					showCreateRoleModal = false;
					if (createRoleContext === "add" && newMemberRoleId === "new")
						newMemberRoleId = roles[0]?.id;
					if (createRoleContext === "edit" && selectedRole === "new")
						selectedRole = selectedMember?.role.id;
				}}>Annuler</button
			>
			<button class="primary-btn" onclick={createRole}>Créer</button>
		</div>
	</Modal>

	<Modal bind:open={showEditAssociationModal} title="Modifier l'association">
		<div class="form-group">
			<label for="asso-name">Nom de l'association</label>
			<input type="text" id="asso-name" bind:value={editAssociationName} />
		</div>
		<div class="form-group">
			<label for="asso-desc">Description (Markdown supporté)</label>
			<textarea
				id="asso-desc"
				bind:value={editAssociationDescription}
				rows="10"
				style="width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; box-sizing: border-box; resize: vertical;"
			></textarea>
		</div>
		<div class="modal-actions">
			<button class="cancel-btn" onclick={() => (showEditAssociationModal = false)}>Annuler</button>
			<button class="primary-btn" onclick={updateAssociation}>Enregistrer</button>
		</div>
	</Modal>

	<Modal bind:open={showDeleteConfirmModal} title="Confirmer la suppression">
		{#if memberToDelete}
			<p>
				Êtes-vous sûr de vouloir retirer <strong
					>{memberToDelete.user.first_name} {memberToDelete.user.last_name}</strong
				> de l'association ?
			</p>
			<div class="modal-actions">
				<button class="cancel-btn" onclick={() => (showDeleteConfirmModal = false)}>Annuler</button>
				<button class="remove-btn" onclick={confirmRemoveMember}>Confirmer</button>
			</div>
		{/if}
	</Modal>
</div>

<style>
	.action-btn {
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: var(--color-text-on-primary);
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
		background: var(--color-bg-1);
		color: var(--color-text);
	}

	.action-btn.secondary:hover {
		filter: brightness(0.9);
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
		background: var(--color-primary);
		color: var(--color-text-on-primary);
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.add-member-btn:hover {
		background: var(--color-primary-dark);
	}

	.form-group {
		margin-bottom: 1.5rem;
		position: relative;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--color-text);
		font-weight: 500;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-bg-1);
		border-radius: 8px;
		font-size: 1rem;
		box-sizing: border-box;
		background: var(--bg-secondary);
		color: var(--color-text);
	}

	.search-results {
		position: absolute;
		top: 100%;
		left: 0;
		width: 100%;
		background: var(--bg-secondary);
		border: 1px solid var(--color-bg-1);
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
		color: var(--color-text);
	}

	.search-result-item:hover {
		background: var(--color-bg-1);
	}

	.create-role-item {
		font-weight: 600;
		color: var(--color-primary);
		border-top: 1px solid var(--color-bg-1);
	}

	.create-role-item:hover {
		background: var(--color-accent-light);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
	}

	.cancel-btn {
		padding: 0.75rem 1.5rem;
		background: var(--color-bg-1);
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

	.remove-btn {
		padding: 0.75rem 1.5rem;
		background: var(--color-secondary);
		color: var(--color-primary-dark);
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}

	.remove-btn:hover {
		filter: brightness(0.9);
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
		margin: 0;
		color: var(--color-primary);
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
		width: 100%;
		background: var(--bg-secondary);
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
		color: var(--color-text);
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
		background: linear-gradient(135deg, var(--color-bg-1) 0%, var(--color-bg-2) 100%);
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
