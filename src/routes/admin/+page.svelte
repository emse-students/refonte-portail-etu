<script lang="ts">
	import { resolve } from "$app/paths";
	import { onMount } from "svelte";
	import Permission, { getPermissionName } from "$lib/permissions";
	import TableEditor from "$lib/components/TableEditor.svelte";
	import type { RawEvent, RawList, RawRole } from "$lib/databasetypes";

	//let { data } = $props();

	// Types
	type View =
		| "dashboard"
		| "users"
		| "user-details"
		| "associations"
		| "events"
		| "lists"
		| "roles"
		| "system";
	type User = {
		id: number;
		first_name: string;
		last_name: string;
		email: string;
		login: string;
		promo: number;
		permissions: number; // Computed
	};
	type Association = {
		id: number;
		handle: string;
		name: string;
		description: string;
		color: number;
	};
	type UserRole = {
		role_name: string;
		permissions: number;
		association_name: string | null;
		list_name: string | null;
	};

	// State
	let currentView = $state<View>("dashboard");
	let users = $state<User[]>([]);
	let associations = $state<Association[]>([]);
	let events = $state<RawEvent[]>([]);
	let lists = $state<RawList[]>([]);
	let roles = $state<RawRole[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// User Details State
	let selectedUser = $state<User | null>(null);
	let userRoles = $state<UserRole[]>([]);

	// Config State
	let config = $state({
		maintenance_mode: "false",
		global_announcement: "",
		event_submission_open: "true",
	});

	// Dashboard Stats
	let stats = $derived({
		userCount: users.length,
		adminCount: users.filter((u) => u.permissions >= Permission.ADMIN).length,
		associationCount: associations.length,
	});

	// Filters
	let userSearch = $state("");
	let showAdminsOnly = $state(false);

	let filteredUsers = $derived(
		users.filter((u) => {
			const matchesSearch =
				u.first_name.toLowerCase().includes(userSearch.toLowerCase()) ||
				u.last_name.toLowerCase().includes(userSearch.toLowerCase()) ||
				u.login.toLowerCase().includes(userSearch.toLowerCase());
			const matchesRole = showAdminsOnly ? u.permissions >= Permission.ADMIN : true;
			return matchesSearch && matchesRole;
		})
	);

	// Fetch Data
	async function loadAllData() {
		loading = true;
		try {
			const [usersRes, assosRes, configRes, eventsRes, listsRes, rolesRes] = await Promise.all([
				fetch(resolve("/api/users")),
				fetch(resolve("/api/associations")),
				fetch(resolve("/api/config")),
				fetch(resolve("/api/events")),
				fetch(resolve("/api/lists")),
				fetch(resolve("/api/roles")),
			]);

			if (usersRes.ok) users = await usersRes.json();
			if (assosRes.ok) associations = await assosRes.json();
			if (configRes.ok) {
				const data = await configRes.json();
				config = { ...config, ...data };
			}
			if (eventsRes.ok) events = await eventsRes.json();
			if (listsRes.ok) lists = await listsRes.json();
			if (rolesRes.ok) roles = await rolesRes.json();
		} catch (e) {
			error = "Erreur de chargement des données";
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadAllData();
	});

	// Actions
	async function viewUserDetails(user: User) {
		selectedUser = user;
		currentView = "user-details";
		loading = true;
		try {
			const res = await fetch(resolve(`/api/users/${user.id}/roles`));
			if (res.ok) {
				userRoles = await res.json();
			} else {
				error = "Erreur lors du chargement des rôles";
			}
		} catch (e) {
			error = "Erreur réseau";
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function saveConfig(key: string, value: string) {
		try {
			const res = await fetch(resolve("/api/config"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ key, value }),
			});
			if (res.ok) {
				config = { ...config, [key]: value };
				// alert("Configuration sauvegardée"); // Optional feedback
			} else {
				alert("Erreur lors de la sauvegarde");
			}
		} catch (e) {
			console.error(e);
			alert("Erreur réseau");
		}
	}

	const userColumns = [
		{ key: "id", label: "ID" },
		{ key: "first_name", label: "First Name", editable: true },
		{ key: "last_name", label: "Last Name", editable: true },
		{ key: "email", label: "Email", editable: true },
		{ key: "login", label: "Login", editable: true },
		{ key: "promo", label: "Promo", editable: true, type: "number" },
	];

	const associationColumns = [
		{ key: "id", label: "ID" },
		{ key: "name", label: "Name", editable: true },
		{ key: "handle", label: "Handle", editable: true },
		{ key: "description", label: "Description", editable: true },
		{ key: "color", label: "Color", editable: true, type: "number" },
	];

	const eventColumns = [
		{ key: "id", label: "ID" },
		{ key: "title", label: "Title", editable: true },
		{ key: "description", label: "Description", editable: true },
		{ key: "location", label: "Location", editable: true },
		{ key: "start_date", label: "Start Date", editable: true, type: "datetime-local" },
		{ key: "end_date", label: "End Date", editable: true, type: "datetime-local" },
		{ key: "validated", label: "Validated", editable: true, type: "boolean" },
	];

	const listColumns = [
		{ key: "id", label: "ID" },
		{ key: "name", label: "Name", editable: true },
		{ key: "handle", label: "Handle", editable: true },
		{ key: "description", label: "Description", editable: true },
		{ key: "promo", label: "Promo", editable: true, type: "number" },
		{ key: "color", label: "Color", editable: true, type: "number" },
	];

	const roleColumns = [
		{ key: "id", label: "ID" },
		{ key: "name", label: "Name", editable: true },
		{ key: "hierarchy", label: "Hierarchy", editable: true, type: "number" },
		{ key: "permissions", label: "Permissions", editable: true, type: "number" },
	];
</script>

<div class="admin-container">
	<aside class="sidebar">
		<div class="brand">Admin Panel</div>
		<nav>
			<button
				class:active={currentView === "dashboard"}
				onclick={() => (currentView = "dashboard")}
			>
				Tableau de bord
			</button>
			<button class:active={currentView === "users"} onclick={() => (currentView = "users")}>
				Utilisateurs
			</button>
			<button
				class:active={currentView === "associations"}
				onclick={() => (currentView = "associations")}
			>
				Associations
			</button>
			<button class:active={currentView === "events"} onclick={() => (currentView = "events")}>
				Événements
			</button>
			<button class:active={currentView === "lists"} onclick={() => (currentView = "lists")}>
				Listes
			</button>
			<button class:active={currentView === "roles"} onclick={() => (currentView = "roles")}>
				Rôles
			</button>
			<button class:active={currentView === "system"} onclick={() => (currentView = "system")}>
				Système
			</button>
			<a href="/admin/logs" class="nav-link"> Logs </a>
		</nav>
	</aside>

	<main class="content">
		{#if loading}
			<div class="loading">Chargement...</div>
		{:else if error}
			<div class="error">{error}</div>
		{:else}
			<!-- DASHBOARD VIEW -->
			{#if currentView === "dashboard"}
				<h1>Tableau de bord</h1>
				<div class="stats-grid">
					<div class="stat-card">
						<h3>Utilisateurs</h3>
						<div class="value">{stats.userCount}</div>
					</div>
					<div class="stat-card">
						<h3>Administrateurs</h3>
						<div class="value">{stats.adminCount}</div>
					</div>
					<div class="stat-card">
						<h3>Associations</h3>
						<div class="value">{stats.associationCount}</div>
					</div>
				</div>

				<!-- USERS VIEW -->
			{:else if currentView === "users"}
				<div class="header-actions">
					<h1>Gestion des Utilisateurs</h1>
					<div class="filters">
						<input type="text" placeholder="Rechercher..." bind:value={userSearch} />
						<label>
							<input type="checkbox" bind:checked={showAdminsOnly} />
							Admins seulement
						</label>
					</div>
				</div>

				<div class="table-container">
					<TableEditor
						data={filteredUsers}
						columns={userColumns}
						action="?/updateUser"
						deleteAction="?/deleteUser"
						extraActions={[
							{
								label: "Détails",
								onClick: (item) => viewUserDetails(item),
								class: "btn-secondary",
							},
						]}
					/>
				</div>

				<!-- USER DETAILS VIEW -->
			{:else if currentView === "user-details" && selectedUser}
				<div class="header-actions">
					<h1>Détails de {selectedUser.first_name} {selectedUser.last_name}</h1>
					<button class="btn-secondary" onclick={() => (currentView = "users")}> Retour </button>
				</div>

				<div class="card mb-4">
					<h3>Informations</h3>
					<p><strong>Login:</strong> {selectedUser.login}</p>
					<p><strong>Email:</strong> {selectedUser.email}</p>
					<p><strong>Promo:</strong> {selectedUser.promo}</p>
					<p>
						<strong>Permissions Globales:</strong>
						{getPermissionName(selectedUser.permissions)}
					</p>
				</div>

				<h3>Rôles et Permissions</h3>
				<div class="table-container">
					<table>
						<thead>
							<tr>
								<th>Rôle</th>
								<th>Contexte</th>
								<th>Permissions</th>
							</tr>
						</thead>
						<tbody>
							{#if userRoles.length === 0}
								<tr>
									<td colspan="3" class="text-center">Aucun rôle assigné</td>
								</tr>
							{:else}
								{#each userRoles as role (role.role_name + role.association_name + role.list_name)}
									<tr>
										<td>{role.role_name}</td>
										<td>
											{#if role.association_name}
												<span class="badge association">{role.association_name}</span>
											{:else if role.list_name}
												<span class="badge list">{role.list_name}</span>
											{:else}
												-
											{/if}
										</td>
										<td>{getPermissionName(role.permissions)}</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>

				<!-- ASSOCIATIONS VIEW -->
			{:else if currentView === "associations"}
				<h1>Associations</h1>
				<div class="table-container">
					<TableEditor
						data={associations}
						columns={associationColumns}
						action="?/updateAssociation"
						deleteAction="?/deleteAssociation"
					/>
				</div>

				<!-- EVENTS VIEW -->
			{:else if currentView === "events"}
				<h1>Événements</h1>
				<div class="table-container">
					<TableEditor
						data={events}
						columns={eventColumns}
						action="?/updateEvent"
						deleteAction="?/deleteEvent"
					/>
				</div>

				<!-- LISTS VIEW -->
			{:else if currentView === "lists"}
				<h1>Listes</h1>
				<div class="table-container">
					<TableEditor
						data={lists}
						columns={listColumns}
						action="?/updateList"
						deleteAction="?/deleteList"
					/>
				</div>

				<!-- ROLES VIEW -->
			{:else if currentView === "roles"}
				<h1>Rôles</h1>
				<div class="table-container">
					<TableEditor
						data={roles}
						columns={roleColumns}
						action="?/updateRole"
						deleteAction="?/deleteRole"
					/>
				</div>

				<!-- SYSTEM VIEW -->
			{:else if currentView === "system"}
				<h1>Configuration du Système</h1>

				<div class="card mb-4">
					<h3>Maintenance</h3>
					<div class="form-group">
						<label>
							<input
								type="checkbox"
								checked={config.maintenance_mode === "true"}
								onchange={(e) =>
									saveConfig("maintenance_mode", e.currentTarget.checked ? "true" : "false")}
							/>
							Mode Maintenance
						</label>
						<p class="help-text">
							Si activé, le site sera inaccessible aux utilisateurs non-admins.
						</p>
					</div>
				</div>

				<div class="card mb-4">
					<h3>Annonces</h3>
					<div class="form-group">
						<label for="announcement">Annonce Globale</label>
						<div class="input-group">
							<input
								id="announcement"
								type="text"
								bind:value={config.global_announcement}
								placeholder="Message..."
							/>
							<button
								class="btn-secondary"
								onclick={() => saveConfig("global_announcement", config.global_announcement)}
							>
								Enregistrer
							</button>
						</div>
					</div>
				</div>

				<div class="card mb-4">
					<h3>Événements</h3>
					<div class="form-group">
						<label>
							<input
								type="checkbox"
								checked={config.event_submission_open === "true"}
								onchange={(e) =>
									saveConfig("event_submission_open", e.currentTarget.checked ? "true" : "false")}
							/>
							Ouverture des soumissions d'événements
						</label>
					</div>
				</div>
			{/if}
		{/if}
	</main>
</div>

<style>
	.admin-container {
		display: flex;
		min-height: 100vh;
		background-color: #f5f7fa;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.sidebar {
		width: 250px;
		background-color: #2c3e50;
		color: white;
		padding: 1rem;
		display: flex;
		flex-direction: column;
	}

	.brand {
		font-size: 1.5rem;
		font-weight: bold;
		margin-bottom: 2rem;
		padding: 0.5rem;
	}

	nav button {
		background: none;
		border: none;
		color: #ecf0f1;
		padding: 1rem;
		text-align: left;
		cursor: pointer;
		width: 100%;
		border-radius: 4px;
		transition: background 0.2s;
	}

	nav button:hover {
		background-color: #34495e;
	}

	nav button.active {
		background-color: #3498db;
		font-weight: bold;
	}

	.nav-link {
		display: block;
		color: #ecf0f1;
		padding: 1rem;
		text-decoration: none;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.nav-link:hover {
		background-color: #34495e;
	}

	.content {
		flex: 1;
		padding: 2rem;
		overflow-y: auto;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-top: 1rem;
	}

	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.stat-card h3 {
		margin: 0;
		color: #7f8c8d;
		font-size: 0.9rem;
		text-transform: uppercase;
	}

	.stat-card .value {
		font-size: 2.5rem;
		font-weight: bold;
		color: #2c3e50;
		margin-top: 0.5rem;
	}

	.header-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.filters {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.input-group {
		display: flex;
		gap: 0.5rem;
	}

	.help-text {
		font-size: 0.85rem;
		color: #7f8c8d;
		margin-top: 0.25rem;
	}

	input[type="text"] {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.table-container {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}

	th {
		background-color: #f8f9fa;
		font-weight: 600;
		color: #2c3e50;
	}

	.badge {
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.85rem;
		background-color: #e0e0e0;
	}

	.badge.association {
		background-color: #3498db;
		color: #fff;
	}

	.badge.list {
		background-color: #9b59b6;
		color: #fff;
	}

	.btn-secondary {
		background-color: #95a5a6;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.mb-4 {
		margin-bottom: 1.5rem;
	}

	.text-center {
		text-align: center;
	}

	.card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
</style>
