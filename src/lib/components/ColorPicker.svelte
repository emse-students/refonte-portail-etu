<script lang="ts">
	let {
		value = $bindable(0),
		label = "Couleur",
	}: {
		value: number;
		label?: string;
	} = $props();

	const palette = [
		"#f7c873",
		"#7ec4cf",
		"#b388ff",
		"#ffb4a2",
		"#a3d977",
		"#ffb300",
		"#90caf9",
		"#ff8a65",
		"#ce93d8",
		"#ffd54f",
	];

	function intToHex(color: number): string {
		return "#" + color.toString(16).padStart(6, "0");
	}

	function hexToInt(hex: string): number {
		return parseInt(hex.replace("#", ""), 16);
	}

	let hexValue = $derived(intToHex(value));

	function handleColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		value = hexToInt(target.value);
	}

	function selectColor(color: string) {
		value = hexToInt(color);
	}
</script>

<div class="color-picker-container">
	<label for="color-input">{label}</label>
	<div class="palette">
		{#each palette as color}
			<button
				class="color-swatch"
				class:selected={intToHex(value) === color}
				style="background-color: {color};"
				onclick={() => selectColor(color)}
				aria-label="Sélectionner la couleur {color}"
			></button>
		{/each}
		<div class="custom-color-wrapper">
			<input
				type="color"
				id="color-input"
				value={hexValue}
				oninput={handleColorChange}
				aria-label="Choisir une couleur personnalisée"
			/>
			<div class="custom-color-overlay" style="background-color: {hexValue};"></div>
		</div>
	</div>
</div>

<style>
	.color-picker-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 500;
		color: #4a5568;
		font-size: 0.95rem;
	}

	.palette {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.color-swatch {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition:
			transform 0.1s,
			box-shadow 0.1s;
		padding: 0;
	}

	.color-swatch:hover {
		transform: scale(1.1);
	}

	.color-swatch.selected {
		border-color: #2d3748;
		box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5);
		transform: scale(1.1);
	}

	.custom-color-wrapper {
		position: relative;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid #e2e8f0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);
	}

	.custom-color-wrapper:hover {
		transform: scale(1.1);
	}

	.custom-color-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 2px solid white;
		pointer-events: none;
	}

	input[type="color"] {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
		padding: 0;
		border: none;
	}
</style>
