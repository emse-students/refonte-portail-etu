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
	let success = $state("");
	let isDragging = $state(false);
	// svelte-ignore state_referenced_locally
	let previewUrl = $state(currentImageId ? `/api/image/${currentImageId}` : "");

	// Cropper state
	let showCropper = $state(false);
	let cropperImageElement = $state<HTMLImageElement>();
	let cropper: Cropper | null = null;
	let tempImageUrl = $state("");
	let originalFile: File | null = null;

	function processFile(file: File) {
		// Check file type
		if (!file.type.startsWith("image/")) {
			error = "Le fichier doit être une image";
			return;
		}

		// Check file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			error = "L'image est trop volumineuse (max 5Mo)";
			return;
		}

		originalFile = file;
		tempImageUrl = URL.createObjectURL(file);
		showCropper = true;
		error = "";
		success = "";
	}

	async function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;

		processFile(target.files[0]);

		// Reset input so same file can be selected again if cancelled
		target.value = "";
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		if (uploading) return;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			processFile(files[0]);
		}
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

	function closeCropperModal() {
		showCropper = false;
		if (tempImageUrl) {
			URL.revokeObjectURL(tempImageUrl);
			tempImageUrl = "";
		}
	}

	function cancelCrop() {
		closeCropperModal();
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

			// Show local preview immediately
			previewUrl = URL.createObjectURL(file);

			// Close modal immediately
			closeCropperModal();

			// Proceed with upload in background
			await uploadFile(file);
		});
	}

	async function uploadFile(file: File) {
		uploading = true;
		error = "";
		success = "";

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
			success = "Image uploadée avec succès !";
			// Auto-hide success message after 3 seconds
			setTimeout(() => {
				success = "";
			}, 3000);
		} catch (e) {
			error = "Erreur lors de l'upload de l'image";
			console.error(e);
		} finally {
			uploading = false;
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="image-upload"
	class:dragging={isDragging}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<input
		type="file"
		accept="image/*"
		bind:this={fileInput}
		onchange={handleFileChange}
		style="display: none;"
	/>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="drop-zone"
		class:has-preview={previewUrl}
		onclick={() => !uploading && fileInput.click()}
	>
		{#if previewUrl}
			<div class="preview" class:uploading>
				<img src={previewUrl} alt="Aperçu" loading="lazy" />
				{#if uploading}
					<div class="upload-overlay">
						<div class="spinner"></div>
					</div>
				{/if}
			</div>
			<span class="change-hint">Cliquer ou glisser pour changer</span>
		{:else}
			<div class="upload-placeholder">
				<svg
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
				<span>Glisser une image ou cliquer</span>
				<span class="hint">PNG, JPG jusqu'à 5Mo</span>
			</div>
		{/if}
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}
	{#if success}
		<p class="success">✓ {success}</p>
	{/if}
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
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.image-upload.dragging .drop-zone {
		border-color: var(--color-primary);
		background: var(--color-primary-light, rgba(var(--color-primary-rgb, 59, 130, 246), 0.1));
	}

	.drop-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem;
		border: 2px dashed var(--color-text-light);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		background: var(--color-bg-1);
		min-width: 200px;
	}

	.drop-zone:hover {
		border-color: var(--color-primary);
		background: var(--color-bg-2);
	}

	.drop-zone.has-preview {
		padding: 1rem;
	}

	.upload-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-light);
	}

	.upload-placeholder svg {
		opacity: 0.7;
	}

	.upload-placeholder span {
		font-size: 0.95rem;
		font-weight: 500;
	}

	.upload-placeholder .hint {
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.preview {
		position: relative;
		width: 120px;
		height: 120px;
		border-radius: 50%;
		overflow: hidden;
		border: 3px solid var(--color-primary);
		background: var(--bg-secondary);
	}

	.preview.uploading {
		opacity: 0.7;
	}

	.preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.upload-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.change-hint {
		font-size: 0.8rem;
		color: var(--color-text-light);
		opacity: 0.8;
	}

	.error {
		color: var(--color-secondary);
		font-size: 0.9rem;
		margin: 0;
	}

	.success {
		color: #16a34a;
		font-size: 0.9rem;
		margin: 0;
		padding: 0.5rem 1rem;
		background: #dcfce7;
		border-radius: 6px;
		font-weight: 500;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
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
		background: #f5f5f5;
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

	/* Cropperjs overrides - show cropped areas with transparency */
	:global(.cropper-container) {
		background: #f5f5f5 !important;
	}

	:global(.cropper-wrap-box) {
		background: transparent !important;
	}

	:global(.cropper-canvas) {
		background: transparent !important;
	}

	:global(.cropper-drag-box) {
		background: transparent !important;
	}

	:global(.cropper-modal) {
		background-color: rgba(0, 0, 0, 0.3) !important;
		opacity: 1 !important;
	}

	:global(.cropper-view-box) {
		outline: 2px solid var(--color-primary) !important;
		outline-color: rgba(59, 130, 246, 0.9) !important;
	}

	:global(.cropper-line) {
		background-color: var(--color-primary) !important;
	}

	:global(.cropper-point) {
		background-color: var(--color-primary) !important;
	}
</style>
