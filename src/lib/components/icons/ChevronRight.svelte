<script lang="ts">
	let { class: className, width = "24", height = "24", ...rest } = $props();
</script>

<svg
	{width}
	{height}
	viewBox="0 0 24 24"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
	{...rest}
>
	<path
		d="M9 18L15 12L9 6"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
</svg>
