<script lang="ts">
	import EntityDetail from "$lib/components/EntityDetail.svelte";

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.association.name} - Vie associative EMSE</title>
	<meta name="description" content={`Presentation de ${data.association.name} a l'EMSE.`} />
</svelte:head>

<EntityDetail
	entity={data.association}
	backHref="/associations"
	backLabel="Toutes les associations"
/>
