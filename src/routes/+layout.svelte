<script lang="ts">
	import Header from "./Header.svelte";
	import "../app.css";
	import Footer from "./Footer.svelte";

	import { page } from "$app/state";


	let { children } = $props();
	const session = page.data.session;
	const userData = page.data.userData;
</script>

<div class="app">
	<Header user={session?.user} userData={userData} />

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
		max-width: 100%;
		margin: 0;
		box-sizing: border-box;
		overflow-x: hidden;
	}
</style>
