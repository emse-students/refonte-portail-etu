<script lang="ts">
	import { resolve } from "$app/paths";
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import Permission, { getPermissionName } from "$lib/permissions";

	type TableName = "users" | "associations" | "roles" | "members" | "events" | "lists";

	type DataRow = Record<string, string | number | boolean | null | undefined>;

	let selectedTable = $state<TableName>("users");
	let data = $state<DataRow[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let editingRow = $state<DataRow | null>(null);
	let showAddForm = $state(false);
	let associations = $state<DataRow[]>([]);
	let users = $state<DataRow[]>([]);
	let roles = $state<DataRow[]>([]);
	let lists = $state<DataRow[]>([]);
	let eventSubmissionOpen = $state(false);

	const tableConfig = {
		users: {
			name: "Utilisateurs",
			columns: ["id", "first_name", "last_name", "email", "login", "permissions"],
			editableColumns: ["first_name", "last_name", "email", "login", "permissions"],
		},
		associations: {
			name: "Associations",
			columns: ["id", "handle", "name", "description", "color"],
			editableColumns: ["handle", "name", "description", "color"],
		},
		lists: {
			name: "Listes",
			columns: [
				"id",
				"handle",
				"name",
				"description",
				"association_id",
				"promo",
				"color",
				"association_name",
			],
			editableColumns: ["handle", "name", "description", "association_id", "promo", "color"],
		},
		roles: {
			name: "Rôles",
			columns: ["id", "name", "hierarchy", "permissions"],
			editableColumns: ["name", "hierarchy", "permissions"],
		},
		members: {
			name: "Membres",
			columns: [
				"id",
				"user_id",
				"association_id",
				"list_id",
				"role_id",
				"visible",
				"first_name",
				"last_name",
				"association_name",
				"list_name",
				"role_name",
			],
			editableColumns: ["user_id", "association_id", "list_id", "role_id", "visible"],
		},
		events: {
			name: "Événements",
			columns: [
				"id",
				"association_id",
				"title",
				"description",
				"start_date",
				"end_date",
				"location",
				"validated",
				"association_name",
			],
			editableColumns: [
				"association_id",
				"title",
				"description",
				"start_date",
				"end_date",
				"location",
				"validated",
			],
		},
	};

	async function fetchData() {
		loading = true;
		error = null;
		try {
			const response = await fetch(resolve(`/api/${selectedTable}`));
			if (!response.ok) throw new Error("Erreur lors du chargement");
			data = await response.json();
		} catch (e) {
			error = e instanceof Error ? e.message : "Erreur inconnue";
		} finally {
			loading = false;
		}
	}

	async function fetchReferenceData() {
		try {
			const [assocResp, usersResp, rolesResp, listsResp, configResp] = await Promise.all([
				fetch(resolve("/api/associations")),
				fetch(resolve("/api/users")),
				fetch(resolve("/api/roles")),
				fetch(resolve("/api/lists")),
				fetch(resolve("/api/config")),
			]);
			associations = await assocResp.json();
			users = await usersResp.json();
			roles = await rolesResp.json();
			lists = await listsResp.json();

			const config = await configResp.json();
			eventSubmissionOpen = config.event_submission_open === "true";
		} catch (e) {
			console.error("Erreur lors du chargement des données de référence", e);
		}
	}

	async function toggleEventSubmission() {
		try {
			const newValue = !eventSubmissionOpen;
			const response = await fetch("/api/config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ key: "event_submission_open", value: newValue }),
			});

			if (!response.ok) throw new Error("Erreur lors de la mise à jour de la configuration");

			eventSubmissionOpen = newValue;
		} catch (e) {
			alert("Erreur: " + (e instanceof Error ? e.message : "Erreur inconnue"));
		}
	}

	async function deleteRow(row: DataRow) {
		if (!confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) return;

		try {
			const response = await fetch(resolve(`/api/${selectedTable}`), {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: row.id }),
			});

			if (!response.ok) throw new Error("Erreur lors de la suppression");
			await fetchData();
		} catch (e) {
			alert("Erreur: " + (e instanceof Error ? e.message : "Erreur inconnue"));
		}
	}

	async function saveRow(row: DataRow) {
		try {
			const method = row.id ? "PUT" : "POST";
			const apiPath = `/api/${selectedTable}`;
			const response = await fetch(apiPath, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(row),
			});

			if (!response.ok) throw new Error("Erreur lors de la sauvegarde");
			await fetchData();
			editingRow = null;
			showAddForm = false;
		} catch (e) {
			alert("Erreur: " + (e instanceof Error ? e.message : "Erreur inconnue"));
		}
	}

	function startEdit(row: DataRow) {
		editingRow = { ...row };
	}

	function startAdd() {
		const config = tableConfig[selectedTable];
		editingRow = config.editableColumns.reduce((acc: DataRow, col: string) => {
			acc[col] = "";
			return acc;
		}, {});
		showAddForm = true;
	}

	function cancelEdit() {
		editingRow = null;
		showAddForm = false;
	}

	function formatValue(
		value: string | number | boolean | null | undefined,
		column: string
	): string {
		if (value === null || value === undefined) return "-";
		if (typeof value === "boolean") return value ? "✓" : "✗";
		if (column === "permissions" && typeof value === "number") {
			return getPermissionName(value);
		}
		if (column.includes("date") && value) {
			return new Date(value as string | number).toLocaleString("fr-FR");
		}
		return String(value);
	}

	onMount(() => {
		const tab = page.url.searchParams.get("tab");
		if (tab && Object.keys(tableConfig).includes(tab)) {
			selectedTable = tab as TableName;
		}
		fetchData();
		fetchReferenceData();
	});

	$effect(() => {
		fetchData();
	});
</script>

<svelte:head>
	<title>Administration Base de Données</title>
</svelte:head>

<div class="admin-container">
	<h1>Administration Base de Données</h1>

	<div class="table-selector">
		<button class:active={selectedTable === "users"} onclick={() => (selectedTable = "users")}>
			Utilisateurs
		</button>
		<button
			class:active={selectedTable === "associations"}
			onclick={() => (selectedTable = "associations")}
		>
			Associations
		</button>
		<button class:active={selectedTable === "lists"} onclick={() => (selectedTable = "lists")}>
			Listes
		</button>
		<button class:active={selectedTable === "roles"} onclick={() => (selectedTable = "roles")}>
			Rôles
		</button>
		<button class:active={selectedTable === "members"} onclick={() => (selectedTable = "members")}>
			Membres
		</button>
		<button class:active={selectedTable === "events"} onclick={() => (selectedTable = "events")}>
			Événements
		</button>
	</div>

	<div class="actions">
		<button class="btn-add" onclick={startAdd}>
			➕ Ajouter {tableConfig[selectedTable].name}
		</button>
		<button class="btn-refresh" onclick={fetchData}> 🔄 Rafraîchir </button>

		{#if selectedTable === "events"}
			<div class="config-toggle">
				<label>
					<input type="checkbox" checked={eventSubmissionOpen} onchange={toggleEventSubmission} />
					Soumission d'événements ouverte
				</label>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="loading">Chargement...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else}
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						{#each tableConfig[selectedTable].columns as column}
							<th>{column}</th>
						{/each}
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if showAddForm && editingRow}
						<tr class="editing-row">
							{#each tableConfig[selectedTable].columns as column}
								<td>
									{#if tableConfig[selectedTable].editableColumns.includes(column)}
										{#if column === "visible" || column === "validated"}
											<input
												type="checkbox"
												checked={!!editingRow[column]}
												onchange={(e) =>
													editingRow && (editingRow[column] = e.currentTarget.checked)}
											/>
										{:else if column === "association_id"}
											<select bind:value={editingRow[column]}>
												<option value="">-</option>
												{#each associations as assoc}
													<option value={assoc.id}>{assoc.name}</option>
												{/each}
											</select>
										{:else if column === "user_id"}
											<select bind:value={editingRow[column]}>
												<option value="">-</option>
												{#each users as user}
													<option value={user.id}>{user.first_name} {user.last_name}</option>
												{/each}
											</select>
										{:else if column === "role_id"}
											<select bind:value={editingRow[column]}>
												<option value="">-</option>
												{#each roles as role}
													<option value={role.id}>{role.name}</option>
												{/each}
											</select>
										{:else if column === "list_id"}
											<select bind:value={editingRow[column]}>
												<option value="">-</option>
												{#each lists as list}
													<option value={list.id}>{list.name}</option>
												{/each}
											</select>
										{:else if column === "permissions"}
											<select bind:value={editingRow[column]}>
												<option value={Permission.MEMBER}>Membre</option>
												<option value={Permission.ROLES}>Gestion Rôles & Membres</option>
												<option value={Permission.EVENTS}>Gestion Événements</option>
												<option value={Permission.ADMIN}>Administration</option>
												<option value={Permission.SITE_ADMIN}>Super Admin</option>
											</select>
										{:else if column.includes("date")}
											<input type="datetime-local" bind:value={editingRow[column]} />
										{:else if column === "description"}
											<textarea bind:value={editingRow[column]}></textarea>
										{:else}
											<input type="text" bind:value={editingRow[column]} />
										{/if}
									{:else}
										-
									{/if}
								</td>
							{/each}
							<td class="actions-cell">
								<button class="btn-save" onclick={() => editingRow && saveRow(editingRow)}
									>💾</button
								>
								<button class="btn-cancel" onclick={cancelEdit}>❌</button>
							</td>
						</tr>
					{/if}
					{#each data as row}
						{#if editingRow && editingRow.id === row.id}
							<tr class="editing-row">
								{#each tableConfig[selectedTable].columns as column}
									<td>
										{#if tableConfig[selectedTable].editableColumns.includes(column)}
											{#if column === "visible"}
												<input
													type="checkbox"
													checked={!!editingRow[column]}
													onchange={(e) =>
														editingRow && (editingRow[column] = e.currentTarget.checked)}
												/>
											{:else if column === "association_id"}
												<select bind:value={editingRow[column]}>
													<option value="">-</option>
													{#each associations as assoc}
														<option value={assoc.id}>{assoc.name}</option>
													{/each}
												</select>
											{:else if column === "user_id"}
												<select bind:value={editingRow[column]}>
													<option value="">-</option>
													{#each users as user}
														<option value={user.id}>{user.first_name} {user.last_name}</option>
													{/each}
												</select>
											{:else if column === "role_id"}
												<select bind:value={editingRow[column]}>
													<option value="">-</option>
													{#each roles as role}
														<option value={role.id}>{role.name}</option>
													{/each}
												</select>
											{:else if column === "list_id"}
												<select bind:value={editingRow[column]}>
													<option value="">-</option>
													{#each lists as list}
														<option value={list.id}>{list.name}</option>
													{/each}
												</select>
											{:else if column.includes("date")}
												<input type="datetime-local" bind:value={editingRow[column]} />
											{:else if column === "description"}
												<textarea bind:value={editingRow[column]}></textarea>
											{:else}
												<input type="text" bind:value={editingRow[column]} />
											{/if}
										{:else}
											{formatValue(row[column], column)}
										{/if}
									</td>
								{/each}
								<td class="actions-cell">
									<button class="btn-save" onclick={() => editingRow && saveRow(editingRow)}
										>💾</button
									>
									<button class="btn-cancel" onclick={cancelEdit}>❌</button>
								</td>
							</tr>
						{:else}
							<tr>
								{#each tableConfig[selectedTable].columns as column}
									<td>{formatValue(row[column], column)}</td>
								{/each}
								<td class="actions-cell">
									<button class="btn-edit" onclick={() => startEdit(row)}>✏️</button>
									<button class="btn-delete" onclick={() => deleteRow(row)}>🗑️</button>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.admin-container {
		max-width: 1400px;
		margin: 2rem auto;
		padding: 0 1rem;
	}

	h1 {
		color: var(--color-primary-dark);
		margin-bottom: 2rem;
	}

	.table-selector {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.table-selector button {
		padding: 0.75rem 1.5rem;
		border: 2px solid var(--color-bg-1);
		background: var(--bg-secondary);
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
		color: var(--color-text);
	}

	.table-selector button:hover {
		background: var(--color-bg-1);
		border-color: var(--color-primary-light);
	}

	.table-selector button.active {
		background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
		color: var(--color-text-on-primary);
		border-color: var(--color-primary-dark);
	}

	.actions {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.btn-add,
	.btn-refresh {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	.btn-add {
		background: var(--color-primary);
		color: var(--color-text-on-primary);
	}

	.btn-add:hover {
		box-shadow: var(--shadow-md);
		filter: brightness(1.1);
	}

	.btn-refresh {
		background: var(--color-secondary);
		color: var(--color-primary-dark);
	}

	.btn-refresh:hover {
		box-shadow: var(--shadow-md);
		filter: brightness(0.95);
	}

	.table-wrapper {
		overflow-x: auto;
		background: var(--bg-secondary);
		border-radius: 12px;
		box-shadow: var(--shadow-md);
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
		color: var(--color-text-on-primary);
	}

	th {
		padding: 1rem;
		text-align: left;
		font-weight: 600;
		white-space: nowrap;
	}

	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-bg-1);
		color: var(--color-text);
	}

	tbody tr:hover {
		background: var(--color-bg-1);
	}

	.editing-row {
		background: var(--color-accent-light) !important;
	}

	.actions-cell {
		display: flex;
		gap: 0.5rem;
		border: none;
	}

	.btn-edit,
	.btn-delete,
	.btn-save,
	.btn-cancel {
		padding: 0.5rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.btn-edit {
		background: var(--color-bg-1);
		color: var(--color-text);
	}

	.btn-edit:hover {
		filter: brightness(0.9);
	}

	.btn-delete {
		background: var(--color-secondary);
		color: var(--color-primary-dark);
	}

	.btn-delete:hover {
		filter: brightness(0.9);
	}

	.btn-save {
		background: var(--color-primary-light);
		color: var(--color-primary-dark);
	}

	.btn-save:hover {
		filter: brightness(0.9);
	}

	.btn-cancel {
		background: var(--color-bg-1);
		color: var(--color-text);
	}

	.btn-cancel:hover {
		filter: brightness(0.9);
	}

	input[type="text"],
	input[type="datetime-local"],
	select,
	textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--color-text-light);
		border-radius: 4px;
		font-family: inherit;
		background: var(--bg-secondary);
		color: var(--color-text);
	}

	textarea {
		min-height: 60px;
		resize: vertical;
	}

	input[type="checkbox"] {
		width: auto;
		cursor: pointer;
	}

	.loading,
	.error {
		padding: 2rem;
		text-align: center;
		font-size: 1.1rem;
	}

	.error {
		color: var(--color-text);
		background: var(--color-secondary);
		border-radius: 8px;
	}

	.config-toggle {
		display: inline-flex;
		align-items: center;
		margin-left: 1rem;
		background: var(--color-bg-1);
		padding: 0.5rem 1rem;
		border-radius: 4px;
		color: var(--color-text);
	}

	.config-toggle label {
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
	}

	@media (max-width: 768px) {
		.table-wrapper {
			overflow-x: scroll;
		}

		th,
		td {
			font-size: 0.875rem;
			padding: 0.5rem;
		}

		.actions-cell {
			flex-direction: column;
		}
	}
</style>
