<script lang="ts">
	import type { Association } from "$lib/databasetypes";

	let { association, associations, initialDate, onClose, onSuccess } = $props<{
		association?: Association;
		associations?: Association[];
		initialDate?: Date;
		onClose: () => void;
		onSuccess: () => void;
	}>();

	let selectedAssociationId = $state(
		association?.id || (associations && associations.length === 1 ? associations[0].id : "")
	);
	let title = $state("");
	let description = $state("");

	// Helper to format date for datetime-local input (YYYY-MM-DDThh:mm)
	function formatDateForInput(date: Date) {
		const d = new Date(date);
		d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
		return d.toISOString().slice(0, 16);
	}

	let startDate = $state(initialDate ? formatDateForInput(initialDate) : "");
	let endDate = $state(
		initialDate ? formatDateForInput(new Date(initialDate.getTime() + 3600000)) : ""
	); // Default +1 hour
	let location = $state("");
	let error = $state("");
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = "";

		if (!selectedAssociationId) {
			error = "Veuillez sélectionner une association";
			loading = false;
			return;
		}

		try {
			const response = await fetch("/api/events", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					association_id: selectedAssociationId,
					title,
					description,
					start_date: new Date(startDate).toISOString(),
					end_date: new Date(endDate).toISOString(),
					location,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Erreur lors de la création de l'événement");
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
		<h2>Proposer un événement</h2>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		<form onsubmit={handleSubmit}>
			{#if !association && associations && associations.length > 1}
				<div class="form-group">
					<label for="association">Association</label>
					<select id="association" bind:value={selectedAssociationId} required>
						<option value="" disabled selected>Choisir une association</option>
						{#each associations as assoc}
							<option value={assoc.id}>{assoc.name}</option>
						{/each}
					</select>
				</div>
			{:else if association}
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
				<button type="button" onclick={onClose}>Annuler</button>
				<button type="submit" disabled={loading}>
					{loading ? "Envoi..." : "Proposer"}
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
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}
	.modal {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		width: 100%;
		max-width: 500px;
		color: black;
	}
	.form-group {
		margin-bottom: 1rem;
	}
	label {
		display: block;
		margin-bottom: 0.5rem;
	}
	input,
	textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 1rem;
	}
	.error {
		color: red;
		margin-bottom: 1rem;
	}
</style>
