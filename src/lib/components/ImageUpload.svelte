<script lang="ts">
	import Cropper from "cropperjs";
	import "cropperjs/dist/cropper.css";

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

	// Cropper state
	let showCropper = $state(false);
	let cropperImageElement = $state<HTMLImageElement>();
	let cropper: Cropper | null = null;
	let tempImageUrl = $state("");
	let originalFile: File | null = null;

	async function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;

		const file = target.files[0];

		// Check file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			error = "L'image est trop volumineuse (max 5Mo)";
			return;
		}

		originalFile = file;
		tempImageUrl = URL.createObjectURL(file);
		showCropper = true;
		error = "";

		// Reset input so same file can be selected again if cancelled
		target.value = "";
	}

	$effect(() => {
		if (showCropper && cropperImageElement) {
			// Initialize cropper when modal is shown and image element is ready
			if (cropper) cropper.destroy();
			cropper = new Cropper(cropperImageElement, {
				aspectRatio: 1,
				viewMode: 1,
				autoCropArea: 1,
				background: false,
				responsive: true,
			});
		} else {
			// Cleanup when modal is hidden
			if (cropper) {
				cropper.destroy();
				cropper = null;
			}
		}
	});

	function cancelCrop() {
		showCropper = false;
		if (tempImageUrl) {
			URL.revokeObjectURL(tempImageUrl);
			tempImageUrl = "";
		}
		error = "";
	}

	function confirmCrop() {
		if (!cropper) return;

		// Get cropped canvas with white background to handle transparency
		const croppedCanvas = cropper.getCroppedCanvas();

		// Create a new canvas with white background
		const canvasWithBg = document.createElement("canvas");
		canvasWithBg.width = croppedCanvas.width;
		canvasWithBg.height = croppedCanvas.height;
		const ctx = canvasWithBg.getContext("2d");

		if (ctx) {
			// Fill with white background
			ctx.fillStyle = "#FFFFFF";
			ctx.fillRect(0, 0, canvasWithBg.width, canvasWithBg.height);
			// Draw the cropped image on top
			ctx.drawImage(croppedCanvas, 0, 0);
		}

		canvasWithBg.toBlob(async (blob: Blob | null) => {
			if (!blob) {
				error = "Erreur lors du recadrage";
				return;
			}

			// Create a new file from the blob
			const file = new File([blob], originalFile?.name || "image.png", { type: blob.type });

			// Proceed with upload
			await uploadFile(file);

			// Cleanup
			cancelCrop();
		});
	}

	async function uploadFile(file: File) {
		uploading = true;
		// Show local preview immediately
		previewUrl = URL.createObjectURL(file);

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
			<img src={previewUrl} alt="Aperçu" loading="lazy" />
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

{#if showCropper}
	<div class="cropper-modal">
		<div class="cropper-content">
			<h3>Recadrer l'image</h3>
			<div class="cropper-container">
				<!-- svelte-ignore a11y_img_redundant_alt -->
				<img src={tempImageUrl} bind:this={cropperImageElement} alt="Image à recadrer" />
			</div>
			<div class="cropper-actions">
				<button class="btn-cancel" onclick={cancelCrop}>Annuler</button>
				<button class="btn-confirm" onclick={confirmCrop}>Valider</button>
			</div>
		</div>
	</div>
{/if}

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

	.preview img {
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

	/* Cropper Modal Styles */
	.cropper-modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.85);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.cropper-content {
		background: var(--color-bg-1);
		padding: 1.5rem;
		border-radius: 12px;
		width: 100%;
		max-width: 600px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-height: 90vh;
	}

	.cropper-content h3 {
		margin: 0;
		color: var(--color-text);
		text-align: center;
	}

	.cropper-container {
		width: 100%;
		height: 400px;
		background: #333;
		border-radius: 8px;
		overflow: hidden;
	}

	.cropper-container img {
		display: block;
		max-width: 100%;
	}

	.cropper-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.cropper-actions button {
		padding: 0.6rem 1.2rem;
		border-radius: 6px;
		border: none;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.95rem;
		transition: opacity 0.2s;
	}

	.cropper-actions button:hover {
		opacity: 0.9;
	}

	.btn-cancel {
		background: var(--color-bg-2);
		color: var(--color-text);
		border: 1px solid var(--color-text-light) !important;
	}

	.btn-confirm {
		background: var(--color-primary);
		color: white;
	}

	/* Cropperjs overrides to fix transparency issues */
	:global(.cropper-container) {
		opacity: 1 !important;
	}

	:global(.cropper-view-box) {
		opacity: 1 !important;
	}

	:global(.cropper-view-box img) {
		opacity: 1 !important;
	}

	:global(.cropper-face) {
		opacity: 1 !important;
		background-color: transparent !important;
	}

	:global(.cropper-modal) {
		background-color: rgba(0, 0, 0, 0.5) !important;
		opacity: 1 !important;
	}
</style>
