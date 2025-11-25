<script lang="ts">
	import type { Association, List, RawEvent } from "$lib/databasetypes";

	let { association, associations, lists, initialDate, onClose, onSuccess, event, isOpen } =
		$props<{
			association?: Association;
			associations?: Association[];
			lists?: List[];
			initialDate?: Date;
			onClose: () => void;
			onSuccess: () => void;
			event?: RawEvent;
			isOpen: boolean;
		}>();

	let entityType = $state<"association" | "list">(event?.list_id ? "list" : "association");

	let selectedAssociationId = $state(
		event?.association_id ||
			association?.id ||
			(associations && associations.length === 1 ? associations[0].id : "")
	);

	let selectedListId = $state(event?.list_id || (lists && lists.length === 1 ? lists[0].id : ""));

	let title = $state(event?.title || "");
	let description = $state(event?.description || "");

	// Helper to format date for datetime-local input (YYYY-MM-DDThh:mm)
	function formatDateForInput(date: Date) {
		const d = new Date(date);
		d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
		return d.toISOString().slice(0, 16);
	}

	let startDate = $state(
		event
			? formatDateForInput(event.start_date)
			: initialDate
				? formatDateForInput(initialDate)
				: ""
	);
	let endDate = $state(
		event
			? formatDateForInput(event.end_date)
			: initialDate
				? formatDateForInput(new Date(initialDate.getTime() + 3600000))
				: ""
	); // Default +1 hour
	let location = $state(event?.location || "");
	let error = $state("");
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = "";

		if (entityType === "association" && !selectedAssociationId) {
			error = "Veuillez sélectionner une association";
			loading = false;
			return;
		}
		if (entityType === "list" && !selectedListId) {
			error = "Veuillez sélectionner une liste";
			loading = false;
			return;
		}

		try {
			const method = event ? "PUT" : "POST";
			const body: Partial<RawEvent> = {
				title,
				description,
				start_date: new Date(startDate),
				end_date: new Date(endDate),
				location,
				validated: event?.validated ?? !isOpen,
			};

			if (entityType === "association") {
				body.association_id = selectedAssociationId;
				body.list_id = undefined;
			} else {
				body.list_id = selectedListId;
				body.association_id = undefined;
			}

			if (event) {
				body.id = event.id;
			}

			const response = await fetch("/api/events", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Erreur lors de l'enregistrement de l'événement");
			}

			onSuccess();
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : "Erreur inconnue";
		} finally {
			loading = false;
		}
	}

	async function handleDelete() {
		if (!event || !confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) return;

		loading = true;
		error = "";

		try {
			const response = await fetch("/api/events", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: event.id }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Erreur lors de la suppression de l'événement");
			}

			onSuccess();
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : "Erreur inconnue";
		} finally {
			loading = false;
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="modal-backdrop"
	onclick={(e) => {
		if (e.target === e.currentTarget) onClose();
	}}
	role="button"
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === "Escape") onClose();
		if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault();
			onClose();
		}
	}}
>
	<div class="modal" role="document">
		<h2>{event ? "Modifier l'événement" : "Proposer un événement"}</h2>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		<form onsubmit={handleSubmit}>
			{#if !association}
				<div class="form-group">
					<span class="label">Type d'entité</span>
					<div class="radio-group">
						<label>
							<input type="radio" bind:group={entityType} value="association" /> Association
						</label>
						<label>
							<input type="radio" bind:group={entityType} value="list" /> Liste
						</label>
					</div>
				</div>

				{#if entityType === "association"}
					<div class="form-group">
						<label for="association">Association</label>
						<select id="association" bind:value={selectedAssociationId} required>
							<option value="" disabled selected>Choisir une association</option>
							{#each associations || [] as assoc}
								<option value={assoc.id}>{assoc.name}</option>
							{/each}
						</select>
					</div>
				{:else}
					<div class="form-group">
						<label for="list">Liste</label>
						<select id="list" bind:value={selectedListId} required>
							<option value="" disabled selected>Choisir une liste</option>
							{#each lists || [] as list}
								<option value={list.id}>{list.name}</option>
							{/each}
						</select>
					</div>
				{/if}
			{:else}
				<p>Pour : <strong>{association.name}</strong></p>
			{/if}

			<div class="form-group">
				<label for="title">Titre</label>
				<input type="text" id="title" bind:value={title} required />
			</div>

			<div class="form-group">
				<label for="description">Description</label>
				<textarea id="description" bind:value={description}></textarea>
			</div>

			<div class="form-group">
				<label for="start-date">Début</label>
				<input type="datetime-local" id="start-date" bind:value={startDate} required />
			</div>

			<div class="form-group">
				<label for="end-date">Fin</label>
				<input type="datetime-local" id="end-date" bind:value={endDate} required />
			</div>

			<div class="form-group">
				<label for="location">Lieu</label>
				<input type="text" id="location" bind:value={location} />
			</div>

			<div class="actions">
				{#if event}
					<button type="button" class="btn-danger" onclick={handleDelete} disabled={loading}>
						Supprimer
					</button>
				{/if}
				<button type="button" onclick={onClose}>Annuler</button>
				<button type="submit" disabled={loading}>
					{loading ? "Envoi..." : event ? "Modifier" : "Proposer"}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	.modal {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		color: #1a202c;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: #7c3aed;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	label,
	.label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #4a5568;
		font-size: 0.95rem;
	}

	input[type="text"],
	input[type="datetime-local"],
	select,
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
		box-sizing: border-box;
		font-family: inherit;
	}

	input[type="text"]:focus,
	input[type="datetime-local"]:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: #7c3aed;
		box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
	}

	textarea {
		min-height: 100px;
		resize: vertical;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid #edf2f7;
	}

	button {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	button[type="submit"] {
		background-color: #7c3aed;
		color: white;
	}

	button[type="submit"]:hover:not(:disabled) {
		background-color: #6d28d9;
		transform: translateY(-1px);
	}

	button[type="submit"]:disabled {
		background-color: #a78bfa;
		cursor: not-allowed;
	}

	button[type="button"]:not(.btn-danger) {
		background-color: #f7fafc;
		color: #4a5568;
		border: 1px solid #e2e8f0;
	}

	button[type="button"]:not(.btn-danger):hover {
		background-color: #edf2f7;
		color: #2d3748;
	}

	.btn-danger {
		background-color: #fee2e2;
		color: #ef4444;
		margin-right: auto;
	}

	.btn-danger:hover {
		background-color: #fecaca;
		color: #dc2626;
	}

	.error {
		background-color: #fff5f5;
		border-left: 4px solid #f56565;
		color: #c53030;
		padding: 1rem;
		margin-bottom: 1.5rem;
		border-radius: 4px;
	}

	.radio-group {
		display: flex;
		gap: 1.5rem;
		padding: 0.5rem 0;
	}

	.radio-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: normal;
		cursor: pointer;
		margin-bottom: 0;
	}

	input[type="radio"] {
		accent-color: #7c3aed;
		width: 1.2em;
		height: 1.2em;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
