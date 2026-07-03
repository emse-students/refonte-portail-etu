<script lang="ts">
	import Header from "./Header.svelte";
	import Footer from "./Footer.svelte";
	import "../app.css";

	let { children } = $props();
</script>

<div class="app">
	<Header />
	<main>
		{@render children()}
	</main>
	<Footer />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		box-sizing: border-box;
	}

	main {
		flex: 1 0 auto;
		display: flex;
		flex-direction: column;
		width: 100%;
		box-sizing: border-box;
		overflow-x: hidden;
	}
</style>
