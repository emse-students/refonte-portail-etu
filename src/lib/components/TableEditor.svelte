<script lang="ts" generics="T extends Record<string, unknown>">
	import { invalidateAll } from "$app/navigation";

	let {
		data = [],
		columns = [],
		action,
		idKey = "id",
		extraActions = [],
	}: {
		data?: T[];
		columns?: { key: string; label: string; type?: string; editable?: boolean }[];
		action: string;
		idKey?: string;
		extraActions?: { label: string; onClick: (item: T) => void; class?: string }[];
	} = $props();

	let editingId: unknown = $state(null);
	let editData: Record<string, unknown> = $state({});

	function startEdit(item: T) {
		editingId = item[idKey];
		editData = { ...item };
		// Format dates for input type="datetime-local"
		for (const col of columns) {
			if (col.type === "datetime-local" && editData[col.key]) {
				const val = editData[col.key];
				if (typeof val === "string" || typeof val === "number" || val instanceof Date) {
					const date = new Date(val);
					// Format to YYYY-MM-DDTHH:mm
					const offset = date.getTimezoneOffset() * 60000;
					const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
					editData[col.key] = localISOTime;
				}
			}
		}
	}

	async function save() {
		const formData = new FormData();
		if (editingId !== null && editingId !== undefined) {
			formData.append("id", String(editingId));
		}
		for (const col of columns) {
			if (col.editable) {
				const val = editData[col.key];
				if (val !== undefined && val !== null) {
					formData.append(col.key, String(val));
				}
			}
		}

		const response = await fetch(action, {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			editingId = null;
			invalidateAll(); // Reloads page data
			window.location.reload(); // Force reload to ensure data is fresh
		} else {
			alert("Error saving");
		}
	}
</script>

<div class="overflow-x-auto">
	<table class="table w-full">
		<thead>
			<tr>
				{#each columns as col (col.key)}
					<th>{col.label}</th>
				{/each}
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data as item (item[idKey])}
				<tr>
					{#if editingId === item[idKey]}
						{#each columns as col (col.key)}
							<td>
								{#if col.editable}
									{#if col.type === "boolean"}
										<select class="select select-bordered select-sm" bind:value={editData[col.key]}>
											<option value={true}>Yes</option>
											<option value={false}>No</option>
										</select>
									{:else if col.type === "datetime-local"}
										<input
											class="input input-bordered input-sm"
											type="datetime-local"
											bind:value={editData[col.key]}
										/>
									{:else}
										<input
											class="input input-bordered input-sm"
											type={col.type || "text"}
											bind:value={editData[col.key]}
										/>
									{/if}
								{:else}
									{item[col.key]}
								{/if}
							</td>
						{/each}
						<td>
							<button class="btn btn-success btn-sm" onclick={save}>Save</button>
							<button class="btn btn-ghost btn-sm" onclick={() => (editingId = null)}>Cancel</button
							>
						</td>
					{:else}
						{#each columns as col (col.key)}
							<td>{item[col.key]}</td>
						{/each}
						<td>
							<button class="btn btn-primary btn-sm" onclick={() => startEdit(item)}>Edit</button>
							{#each extraActions as action (action.label)}
								<button
									class={action.class || "btn btn-secondary btn-sm"}
									onclick={() => action.onClick(item)}>{action.label}</button
								>
							{/each}
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}

	th {
		background-color: #f8f9fa;
		font-weight: 600;
	}

	.btn {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		border: none;
		font-size: 0.875rem;
		margin-right: 0.25rem;
	}

	.btn-primary {
		background-color: #3498db;
		color: white;
	}

	.btn-secondary {
		background-color: #95a5a6;
		color: white;
	}

	.btn-success {
		background-color: #2ecc71;
		color: white;
	}

	.btn-danger {
		background-color: #e74c3c;
		color: white;
	}

	.btn-ghost {
		background-color: transparent;
		color: #7f8c8d;
	}

	.btn-ghost:hover {
		background-color: #ecf0f1;
	}

	.input {
		padding: 0.25rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		width: 100%;
	}

	.select {
		padding: 0.25rem;
		border: 1px solid #ddd;
		border-radius: 4px;
	}
</style>
