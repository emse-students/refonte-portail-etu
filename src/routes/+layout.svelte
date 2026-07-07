<script lang="ts">
	import Header from "./Header.svelte";
	import Footer from "./Footer.svelte";
	import "../app.css";

	let { children } = $props();
</script>

<div class="flex flex-col min-h-screen box-border">
	<Header />
	<main class="flex-1 flex flex-col w-full box-border overflow-x-hidden relative z-0">
		{@render children()}
	</main>
	<Footer />
</div>
