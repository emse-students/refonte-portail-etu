<script lang="ts">
	import welcome from "$lib/images/svelte-welcome.webp";
	import welcomeFallback from "$lib/images/svelte-welcome.png";
	import Calendar from "$lib/components/calendar/Calendar.svelte";

	// load session
	import { page } from "$app/state";
	let session = page.data.session;
	console.log(session);
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<h1>
		Welcome {session?.user?.name ?? 'to the Svelte demo app'}!
	</h1>

	<div class="calendar-fixed-container">
		<Calendar />
	</div>

</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}
	
	.calendar-fixed-container {
		max-width: 95vw;
		min-height: 420px;
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 2rem 0;
		box-shadow: 0 2px 12px rgba(0,0,0,0.07);
		background: #fff;
		border-radius: 12px;
		padding: 1.5rem;
	}
</style>
