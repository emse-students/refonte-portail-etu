<script lang="ts">
	let { data } = $props();
</script>

<div class="admin-container">
	<div class="header-actions">
		<h1>Audit Logs</h1>
		<a href="/admin" class="btn-secondary">Retour au Dashboard</a>
	</div>

	<div class="table-container">
		<table class="table w-full">
			<thead>
				<tr>
					<th>Action</th>
					<th>User</th>
					<th>Timestamp</th>
				</tr>
			</thead>
			<tbody>
				{#if data.logs && data.logs.length > 0}
					{#each data.logs as log}
						<tr>
							<td>{log.action}</td>
							<td>{log.user}</td>
							<td>{log.timestamp}</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="3" class="text-center">No logs found</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>

<style>
	.admin-container {
		padding: 2rem;
		background-color: #f5f7fa;
		min-height: 100vh;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.header-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	h1 {
		margin: 0;
		color: #2c3e50;
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

	.text-center {
		text-align: center;
	}

	.btn-secondary {
		background-color: #95a5a6;
		color: white;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.btn-secondary:hover {
		background-color: #7f8c8d;
	}
</style>
