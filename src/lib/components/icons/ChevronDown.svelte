<script lang="ts">
	let { class: className, width = "24", height = "24", ...rest } = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	{width}
	{height}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	{...rest}
>
	<polyline points="6 9 12 15 18 9"></polyline>
</svg>
