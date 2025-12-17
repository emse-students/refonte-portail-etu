<script lang="ts">
	import type { Association, List, RawEvent } from "$lib/databasetypes";
	import Modal from "$lib/components/Modal.svelte";

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

	// Helper to format date for datetime-local input (YYYY-MM-DDThh:mm)
	function formatDateForInput(date: Date) {
		const d = new Date(date);
		d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
		return d.toISOString().slice(0, 16);
	}

	function getInitialState(
		event: RawEvent | undefined,
		initialDate: Date | undefined,
		association: Association | undefined,
		associations: Association[] | undefined,
		lists: List[] | undefined
	) {
		return {
			entityType: (event?.list_id ? "list" : "association") as "association" | "list",
			selectedAssociationId:
				event?.association_id ||
				association?.id ||
				(associations && associations.length === 1 ? associations[0].id : ""),
			selectedListId: event?.list_id || (lists && lists.length === 1 ? lists[0].id : ""),
			title: event?.title || "",
			description: event?.description || "",
			startDate: event
				? formatDateForInput(event.start_date)
				: initialDate
					? formatDateForInput(initialDate)
					: "",
			endDate: event
				? formatDateForInput(event.end_date)
				: initialDate
					? formatDateForInput(new Date(initialDate.getTime() + 3600000))
					: "",
			location: event?.location || "",
		};
	}

	//svelte-ignore state_referenced_locally
	let formState = $state(getInitialState(event, initialDate, association, associations, lists));

	$effect(() => {
		formState = getInitialState(event, initialDate, association, associations, lists);
	});

	let showDeleteConfirm = $state(false);
	let error = $state("");
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = "";

		if (formState.entityType === "association" && !formState.selectedAssociationId) {
			error = "Veuillez sélectionner une association";
			loading = false;
			return;
		}
		if (formState.entityType === "list" && !formState.selectedListId) {
			error = "Veuillez sélectionner une liste";
			loading = false;
			return;
		}

		try {
			const method = event ? "PUT" : "POST";
			const body: Partial<RawEvent> = {
				title: formState.title,
				description: formState.description,
				start_date: new Date(formState.startDate),
				end_date: new Date(formState.endDate),
				location: formState.location,
				validated: event?.validated ?? !isOpen,
			};

			if (formState.entityType === "association") {
				body.association_id = Number(formState.selectedAssociationId);
				body.list_id = undefined;
			} else {
				body.list_id = Number(formState.selectedListId);
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

	function handleDelete() {
		if (!event) return;
		showDeleteConfirm = true;
	}

	async function confirmDelete() {
		if (!event) return;

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

			showDeleteConfirm = false;
			onSuccess();
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : "Erreur inconnue";
			showDeleteConfirm = false;
		} finally {
			loading = false;
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="event-form-container">
	{#if error}
		<div class="error">{error}</div>
	{/if}

	<form onsubmit={handleSubmit}>
		{#if !association}
			<div class="form-group">
				<span class="label">Type d'entité</span>
				<div class="radio-group">
					<label>
						<input type="radio" bind:group={formState.entityType} value="association" /> Association
					</label>
					<label>
						<input type="radio" bind:group={formState.entityType} value="list" /> Liste
					</label>
				</div>
			</div>

			{#if formState.entityType === "association"}
				<div class="form-group">
					<label for="association">Association</label>
					<select id="association" bind:value={formState.selectedAssociationId} required>
						<option value="" disabled selected>Choisir une association</option>
						{#each associations || [] as assoc}
							<option value={assoc.id}>{assoc.name}</option>
						{/each}
					</select>
				</div>
			{:else}
				<div class="form-group">
					<label for="list">Liste</label>
					<select id="list" bind:value={formState.selectedListId} required>
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
			<input type="text" id="title" bind:value={formState.title} required />
		</div>

		<div class="form-group">
			<label for="description">Description</label>
			<textarea id="description" bind:value={formState.description}></textarea>
		</div>

		<div class="form-group">
			<label for="start-date">Début</label>
			<input type="datetime-local" id="start-date" bind:value={formState.startDate} required />
		</div>

		<div class="form-group">
			<label for="end-date">Fin</label>
			<input type="datetime-local" id="end-date" bind:value={formState.endDate} required />
		</div>

		<div class="form-group">
			<label for="location">Lieu</label>
			<input type="text" id="location" bind:value={formState.location} />
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

	<Modal bind:open={showDeleteConfirm} title="Confirmer la suppression">
		<p>Êtes-vous sûr de vouloir supprimer cet événement ?</p>
		<div class="modal-actions">
			<button class="cancel-btn" onclick={() => (showDeleteConfirm = false)}>Annuler</button>
			<button class="remove-btn" onclick={confirmDelete}>Supprimer</button>
		</div>
	</Modal>
</div>

<style>
	.event-form-container {
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
		background: var(--color-bg-1);
		color: var(--color-text);
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
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

	.form-group {
		margin-bottom: 1.25rem;
	}

	label,
	.label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: var(--color-text);
		font-size: 0.95rem;
	}

	input[type="text"],
	input[type="datetime-local"],
	select,
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-bg-1);
		border-radius: 8px;
		font-size: 1rem;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
		box-sizing: border-box;
		font-family: inherit;
		background: var(--bg-secondary);
		color: var(--color-text);
	}

	input[type="text"]:focus,
	input[type="datetime-local"]:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--shadow-sm);
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
		border-top: 1px solid var(--color-bg-1);
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
		background-color: var(--color-primary);
		color: var(--color-text-on-primary);
	}

	button[type="submit"]:hover:not(:disabled) {
		background-color: var(--color-primary-dark);
		transform: translateY(-1px);
	}

	button[type="submit"]:disabled {
		background-color: var(--color-primary-light);
		cursor: not-allowed;
	}

	button[type="button"]:not(.btn-danger) {
		background-color: var(--color-bg-1);
		color: var(--color-text);
		border: 1px solid var(--color-bg-1);
	}

	button[type="button"]:not(.btn-danger):hover {
		background-color: var(--color-bg-2);
		color: var(--color-text);
	}

	.btn-danger {
		background-color: var(--color-secondary);
		color: var(--color-primary-dark);
		margin-right: auto;
	}

	.btn-danger:hover {
		filter: brightness(0.9);
	}

	.error {
		background-color: var(--color-bg-1);
		border-left: 4px solid var(--color-secondary);
		color: var(--color-text);
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
		accent-color: var(--color-primary);
		width: 1.2em;
		height: 1.2em;
	}
</style>
