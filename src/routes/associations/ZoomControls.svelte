<script lang="ts">
	let { zoomLevel = $bindable(), minZoom, maxZoom } = $props();

	function zoomIn() {
		if (zoomLevel < maxZoom) {
			zoomLevel = Math.min(maxZoom, zoomLevel * 1.2);
		}
	}

	function zoomOut() {
		if (zoomLevel > minZoom) {
			zoomLevel = Math.max(minZoom, zoomLevel / 1.2);
		}
	}
</script>

<div class="zoom-controls">
	<button class="zoom-btn" onclick={zoomIn} title="Zoomer" disabled={zoomLevel >= maxZoom}>+</button>
	<div class="zoom-level">{Math.round(zoomLevel * 100)}%</div>
	<button class="zoom-btn" onclick={zoomOut} title="Dézoomer" disabled={zoomLevel <= minZoom}>−</button>
</div>

<style>
	.zoom-controls {
		position: fixed;
		top: 7rem;
		right: 2rem;
		z-index: 800;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.zoom-btn {
		width: 3rem;
		height: 3rem;
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: bold;
		color: #4a5568;
		cursor: pointer;
		transition: all 0.2s ease;
		user-select: none;
	}
	.zoom-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 1);
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	.zoom-btn:active:not(:disabled) {
		transform: scale(0.95);
	}
    .zoom-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
	.zoom-level {
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 1rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		color: #4a5568;
		text-align: center;
		font-weight: 600;
	}
	@media (max-width: 1024px) {
		.zoom-controls {
			top: 1rem;
			right: 1rem;
		}
	}
</style>
