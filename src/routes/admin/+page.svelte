<script lang="ts">
	import { resolve } from "$app/paths";
	import { onMount } from "svelte";
	import Permission, { getPermissionName } from "$lib/permissions";

	// Types
	type View = "dashboard" | "users" | "associations" | "roles" | "system";
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

	// State
	let currentView = $state<View>("dashboard");
	let users = $state<User[]>([]);
	let associations = $state<Association[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

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
			const [usersRes, assosRes] = await Promise.all([
				fetch(resolve("/api/users")),
				fetch(resolve("/api/associations")),
			]);

			if (usersRes.ok) users = await usersRes.json();
			if (assosRes.ok) associations = await assosRes.json();
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
	async function deleteUser(id: number) {
		if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
		try {
			const res = await fetch(resolve("/api/users"), {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id }),
			});
			if (res.ok) {
				users = users.filter((u) => u.id !== id);
			} else {
				alert("Erreur lors de la suppression");
			}
		} catch (e) {
			console.error(e);
		}
	}
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
			<button class:active={currentView === "system"} onclick={() => (currentView = "system")}>
				Système
			</button>
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
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Nom</th>
								<th>Login</th>
								<th>Promo</th>
								<th>Permissions Globales</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredUsers as user}
								<tr>
									<td>{user.id}</td>
									<td>{user.first_name} {user.last_name}</td>
									<td>{user.login}</td>
									<td>{user.promo}</td>
									<td>
										<span
											class="badge"
											class:admin={user.permissions >= Permission.ADMIN}
											class:site-admin={user.permissions >= Permission.SITE_ADMIN}
										>
											{getPermissionName(user.permissions)}
										</span>
									</td>
									<td>
										<button class="btn-danger" onclick={() => deleteUser(user.id)}>
											Supprimer
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- ASSOCIATIONS VIEW -->
			{:else if currentView === "associations"}
				<h1>Associations</h1>
				<div class="grid-list">
					{#each associations as asso}
						<div class="card">
							<h3>{asso.name}</h3>
							<p class="handle">@{asso.handle}</p>
							<p>{asso.description}</p>
						</div>
					{/each}
				</div>

				<!-- SYSTEM VIEW -->
			{:else if currentView === "system"}
				<h1>Système</h1>
				<p>Configuration du système (à implémenter)</p>
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

	.badge.admin {
		background-color: #f1c40f;
		color: #fff;
	}

	.badge.site-admin {
		background-color: #e74c3c;
		color: #fff;
	}

	.btn-danger {
		background-color: #e74c3c;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.grid-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.handle {
		color: #7f8c8d;
		font-style: italic;
	}
</style>
