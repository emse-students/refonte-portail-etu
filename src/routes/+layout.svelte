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
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
