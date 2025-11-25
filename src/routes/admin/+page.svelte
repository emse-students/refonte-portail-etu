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
		color: #5b21b6;
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
		border: 2px solid #e9d5ff;
		background: white;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
	}

	.table-selector button:hover {
		background: #f3e8ff;
		border-color: #c4b5fd;
	}

	.table-selector button.active {
		background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%);
		color: white;
		border-color: #5b21b6;
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
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
	}

	.btn-add:hover {
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	.btn-refresh {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
	}

	.btn-refresh:hover {
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	.table-wrapper {
		overflow-x: auto;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%);
		color: white;
	}

	th {
		padding: 1rem;
		text-align: left;
		font-weight: 600;
		white-space: nowrap;
	}

	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e9d5ff;
	}

	tbody tr:hover {
		background: #faf5ff;
	}

	.editing-row {
		background: #fef3c7 !important;
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
		background: #dbeafe;
	}

	.btn-edit:hover {
		background: #93c5fd;
	}

	.btn-delete {
		background: #fee2e2;
	}

	.btn-delete:hover {
		background: #fca5a5;
	}

	.btn-save {
		background: #dcfce7;
	}

	.btn-save:hover {
		background: #86efac;
	}

	.btn-cancel {
		background: #fef3c7;
	}

	.btn-cancel:hover {
		background: #fde047;
	}

	input[type="text"],
	input[type="datetime-local"],
	select,
	textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-family: inherit;
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
		color: #dc2626;
		background: #fee2e2;
		border-radius: 8px;
	}

	.config-toggle {
		display: inline-flex;
		align-items: center;
		margin-left: 1rem;
		background: #f0f0f0;
		padding: 0.5rem 1rem;
		border-radius: 4px;
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
