<script lang="ts">
	import Header from "./Header.svelte";
	import "../app.css";
	import Footer from "./Footer.svelte";

	let { children, data } = $props();
	let { user } = data;
</script>

<div class="app">
	<Header {user} />

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
		height: 100vh;
		box-sizing: border-box;
	}

	main {
		flex: 1 0 auto;
		display: flex;
		flex-direction: column;
		padding: 1rem 0;
		width: 100vw;
		max-width: 100vw;
		margin: 0;
		box-sizing: border-box;
		min-height: 0;
		overflow-x: hidden;
	}
</style>
