<script lang="ts">
	let {
		currentImageId,
		onImageUploaded,
		associationId,
		listId,
	}: {
		currentImageId?: number | null;
		onImageUploaded: (id: number) => void;
		associationId?: number | null;
		listId?: number | null;
	} = $props();

	let fileInput: HTMLInputElement;
	let uploading = $state(false);
	let error = $state("");
	// svelte-ignore state_referenced_locally
	let previewUrl = $state(currentImageId ? `/api/image/${currentImageId}` : "");

	async function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;

		const file = target.files[0];

		// Check file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			error = "L'image est trop volumineuse (max 5Mo)";
			return;
		}

		// Show local preview immediately
		previewUrl = URL.createObjectURL(file);

		uploading = true;
		error = "";

		const formData = new FormData();
		formData.append("image", file);

		if (associationId) {
			formData.append("association_id", associationId.toString());
		} else if (listId) {
			formData.append("list_id", listId.toString());
		}

		try {
			const res = await fetch("/api/image", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				console.error("Upload failed:", await res.json());

				throw new Error("Erreur lors de l'upload");
			}

			const data = await res.json();
			onImageUploaded(data.id);
			// Keep local preview to avoid loading delay
		} catch (e) {
			error = "Erreur lors de l'upload de l'image";
			console.error(e);
		} finally {
			uploading = false;
		}
	}
</script>

<div class="image-upload">
	{#if previewUrl}
		<div class="preview">
			<enhanced:img src={previewUrl} alt="Aperçu" loading="lazy" />
		</div>
	{/if}

	<div class="upload-controls">
		<input
			type="file"
			accept="image/*"
			bind:this={fileInput}
			onchange={handleFileChange}
			style="display: none;"
		/>
		<button type="button" class="upload-btn" onclick={() => fileInput.click()} disabled={uploading}>
			{uploading ? "Upload en cours..." : previewUrl ? "Changer l'image" : "Ajouter une image"}
		</button>
		{#if error}
			<p class="error">{error}</p>
		{/if}
	</div>
</div>

<style>
	.image-upload {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.preview {
		width: 150px;
		height: 150px;
		border-radius: 50%;
		overflow: hidden;
		border: 3px solid var(--color-primary);
		background: var(--bg-secondary);
	}

	.preview enhanced\:img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.upload-btn {
		padding: 0.5rem 1rem;
		background: var(--color-bg-1);
		border: 1px solid var(--color-text-light);
		border-radius: 8px;
		cursor: pointer;
		color: var(--color-text);
		font-weight: 500;
		transition: all 0.2s;
	}

	.upload-btn:hover {
		background: var(--color-bg-2);
	}

	.error {
		color: var(--color-secondary);
		font-size: 0.9rem;
		margin: 0;
	}
</style>
