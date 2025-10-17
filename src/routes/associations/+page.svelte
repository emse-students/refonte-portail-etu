<script lang="ts">
	import { onMount } from "svelte";
	import type { Association } from "$lib/databasetypes.d.ts";
	import Bubble from "./Bubble.svelte";
	import DetailsPanel from "./DetailsPanel.svelte";
	import ZoomControls from "./ZoomControls.svelte";

	let { data } = $props();
	let associations: Association[] = data.associations;

	let searchQuery = $state("");
	let selectedAssociation = $state<Association | null>(null);

	let isDragging = $state(false);
	let dragStart = { x: 0, y: 0 };
	let canvasOffset = $state({ x: 50, y: 50 });
	let lastCanvasOffset = { x: 50, y: 50 };
	let zoomLevel = $state(1);
	const minZoom = 0.5;
	const maxZoom = 3;

	const filteredAssociations = $derived(
		associations.filter(
				(a) =>
					a.name.toLowerCase().includes(searchQuery) ||
					a.description?.toLowerCase().includes(searchQuery)
			));

	function handleSelectAssociation(association: Association) {
		selectedAssociation = association;
	}

	function closeDetails() {
		selectedAssociation = null;
	}

	function setupDragHandlers(container: HTMLElement, canvas: HTMLElement) {
		container.addEventListener("mousedown", (e) => {
			if ((e.target as HTMLElement).closest(".bubble")) return;
			isDragging = true;
			container.classList.add("dragging");
			dragStart = {
				x: e.clientX - canvasOffset.x,
				y: e.clientY - canvasOffset.y,
			};
			e.preventDefault();
		});

		document.addEventListener("mousemove", (e) => {
			if (!isDragging) return;
			canvasOffset = {
				x: e.clientX - dragStart.x,
				y: e.clientY - dragStart.y,
			};
		});

		document.addEventListener("mouseup", () => {
			if (isDragging) {
				isDragging = false;
				container.classList.remove("dragging");
				lastCanvasOffset = { ...canvasOffset };
			}
		});
	}

	onMount(() => {
		const container = document.getElementById("bubbleContainer");
		const canvas = document.getElementById("bubbleCanvas");
		if (container && canvas) {
			setupDragHandlers(container, canvas);
		}

		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && selectedAssociation) {
				closeDetails();
			}
		});
	});
</script>

<div class="main-layout">
	<div
		class="bubble-container"
		id="bubbleContainer"
		class:dragging={isDragging}
	>
		<div
			class="bubble-canvas"
			id="bubbleCanvas"
			style="transform: translate({canvasOffset.x}px, {canvasOffset.y}px) scale({zoomLevel})"
		>
			{#each filteredAssociations as association (association.id)}
				<Bubble
					{association}
					isSelected={selectedAssociation?.id === association.id}
					onclick={() => handleSelectAssociation(association)}
				/>
			{/each}
		</div>
	</div>

	<ZoomControls bind:zoomLevel {minZoom} {maxZoom} />

	{#if selectedAssociation}
		<DetailsPanel
			association={selectedAssociation}
			onclose={closeDetails}
		/>
	{/if}
</div>

<style>
	.main-layout {
		display: flex;
		min-height: 100vh;
		margin-top: 5rem;
	}
	.bubble-container {
		flex: 1;
		position: relative;
		overflow: hidden;
		min-height: calc(100vh - 5rem);
		padding: 2rem;
		cursor: grab;
		user-select: none;
	}
	.bubble-container.dragging {
		cursor: grabbing;
	}
	.bubble-canvas {
		position: relative;
		width: 100%;
		height: 100%;
		transition: transform 0.1s ease-out;
		transform-origin: center center;
	}
	@media (max-width: 1024px) {
		.main-layout {
			flex-direction: column;
			margin-top: 0;
		}
		.bubble-container {
			margin-left: 0;
		}
	}
</style>
